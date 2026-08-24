import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, X, BookOpen, Database, Clock3, CircleAlert, Info, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { BookUploader } from '../../components/shared/BookUploader';
import { BookLibraryTable } from '../../components/shared/BookLibraryTable';
import { AiQuestionGenerator } from '../../components/shared/AiQuestionGenerator';
import { useBookLibrary } from '../../lib/bookLibrary';

/**
 * A school's own supplementary book shelf. Uploads here are school-scoped —
 * only this school's students retrieve from them — and capped per class and
 * subject, with a support ticket as the only route past the cap so the
 * platform team stays in the loop on storage growth.
 */

interface SubjectRow {
  class_num: number;
  subject: string;
}

// Must match SCHOOL_UPLOAD_LIMIT_PER_SUBJECT in api/src/services/superAdminContent.service.ts
const UPLOAD_LIMIT_PER_SUBJECT = 3;

export const SchoolAdminContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const lib = useBookLibrary({ basePath: '/school-admin' });
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorNotice, setGeneratorNotice] = useState('');

  useEffect(() => {
    void api.get<SubjectRow[]>('/school-admin/subjects').then(setSubjects).catch(() => { /* the form explains an empty list */ });
  }, []);

  const subjectsForClass = useMemo(
    () => (classNum: number) => subjects.filter((s) => s.class_num === classNum).map((s) => s.subject),
    [subjects],
  );

  /** Every class+subject this school runs — the generator's picker options. */
  const generatorScope = useMemo(() => {
    const byClass = new Map<number, string[]>();
    for (const row of subjects) {
      byClass.set(row.class_num, [...(byClass.get(row.class_num) ?? []), row.subject]);
    }
    return [...byClass.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([classNum, subjectList]) => ({ classNum, subjects: subjectList }));
  }, [subjects]);

  // A failed job holds no storage and never reached the tutor, so it doesn't
  // burn a slot — matching how the server counts them.
  const quotaFor = useMemo(
    () => (classNum: number, subject: string) => ({
      used: lib.all.filter((j) => j.class_num === classNum && j.subject === subject && j.status !== 'error').length,
      limit: UPLOAD_LIMIT_PER_SUBJECT,
    }),
    [lib.all],
  );

  const goRaiseTicket = (classNum: number, subject: string) => {
    navigate('/school-admin/tickets', {
      state: {
        prefillTicket: {
          category: 'content',
          subject: `More book uploads needed — Class ${classNum} ${subject}`,
          body: `We've reached the limit of ${UPLOAD_LIMIT_PER_SUBJECT} uploaded books for Class ${classNum} ${subject} and need to add more. Could you help us add: `,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PortalPageHeader
        eyebrow="Content library"
        title="Your school's books"
        description="Upload supplementary PDFs for your own students. Each book is read, indexed and then answerable by the AI tutor — alongside the platform's own curriculum library."
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Books" value={lib.counts.total} hint="uploaded by your school" icon={<BookOpen size={18} />} />
          <MetricCard label="Ready" value={lib.counts.ready} hint="answerable by the tutor" icon={<Database size={18} />} tone="emerald" />
          <MetricCard label="Processing" value={lib.counts.processing} hint="being indexed" icon={<Clock3 size={18} />} tone="sky" />
          <MetricCard
            label="Needs attention"
            value={lib.counts.failed}
            hint={lib.counts.failed ? 'failed — re-process them' : 'all healthy'}
            icon={<CircleAlert size={18} />}
            tone={lib.counts.failed ? 'rose' : 'slate'}
          />
        </div>
      </PortalPageHeader>

      {lib.error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          <AlertCircle size={15} className="shrink-0" /> {lib.error}
          <button onClick={() => lib.setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      <BookUploader
        uploadPath="/school-admin/ncert/upload"
        subjectsForClass={subjectsForClass}
        onUploaded={() => void lib.reload()}
        title="Upload a book"
        subtitle={`PDF up to 150 MB · visible only to your school · ${UPLOAD_LIMIT_PER_SUBJECT} books per class & subject.`}
        titlePlaceholder="Extra Practice Worksheets (Class 7)"
        quotaFor={quotaFor}
        onQuotaExceeded={goRaiseTicket}
        quotaActionLabel="Raise a ticket to add more"
        footerNote={
          <span className="flex items-start gap-2">
            <Info size={14} className="mt-px shrink-0 text-slate-400" />
            <span>
              Indexing runs in the background — you can leave this page. A book becomes
              <span className="font-semibold text-emerald-700"> Ready</span> once the tutor can cite it,
              usually within a few minutes of upload.
            </span>
          </span>
        }
      />

      <BookLibraryTable
        lib={lib}
        heading="Your school's library"
        description="Only your students retrieve from these books. Status refreshes automatically."
      />

      {/* The books uploaded above are exactly what generation reads from, so
          the generator belongs on this page: a School Admin can seed the
          question bank for a class straight after uploading its book, without
          waiting for a teacher to do it. */}
      <div className="portal-panel p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
              <Sparkles size={16} className="text-indigo-500" /> Generate questions from these books
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Questions are drafted only from your indexed books, reviewed by you, then saved to the school question bank
              where any teacher can pull them into an exam.
            </p>
          </div>
          <button
            onClick={() => setShowGenerator((v) => !v)}
            className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            {showGenerator ? 'Close' : 'Open generator'}
          </button>
        </div>

        {showGenerator && (
          generatorScope.length === 0 ? (
            <p className="text-[12px] text-slate-400">
              No class subjects are configured for your school yet, so there's nothing to generate against.
            </p>
          ) : (
            <AiQuestionGenerator
              portal="school-admin"
              scope={generatorScope}
              onSaved={({ saved }) => setGeneratorNotice(`${saved} question${saved === 1 ? '' : 's'} saved to your school question bank.`)}
            />
          )
        )}

        {generatorNotice && (
          <p className="text-[12px] font-semibold text-emerald-700">{generatorNotice}</p>
        )}
      </div>
    </div>
  );
};
