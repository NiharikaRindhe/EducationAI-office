import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Plus, AlertCircle, Users, TriangleAlert, LayoutGrid, UserCheck, UserRoundX, BookOpenCheck } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { buildTeacherLabels, duplicateTeacherNames } from '../../lib/teacherLabel';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';

interface SectionRow {
  id: string;
  class_num: number;
  section_label: string;
  academic_year: string;
  is_active: boolean;
  class_teacher_id: string | null;
  classTeacherName: string | null;
  studentCount: number;
}

interface TeacherRow {
  id: string;
  full_name: string;
  teacher_profiles?: { employee_id?: string | null; specialization?: string | null } | null;
}

interface SubjectRow {
  class_num: number;
  subject: string;
}

interface AssignmentRow {
  id: string;
  teacher_id: string;
  class_section_id: string;
  subject: string;
}

export const SchoolAdminClassesSections: React.FC = () => {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-section form
  const [newClass, setNewClass] = useState(1);
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Which class the subject-teacher matrix shows
  const [matrixClass, setMatrixClass] = useState<number | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sectionData, teacherData, subjectData, assignmentData] = await Promise.all([
        api.get<SectionRow[]>('/school-admin/class-sections'),
        api.get<TeacherRow[]>('/school-admin/teachers'),
        api.get<SubjectRow[]>('/school-admin/subjects'),
        api.get<AssignmentRow[]>('/school-admin/teaching-assignments'),
      ]);
      setSections(sectionData);
      setTeachers(teacherData.map((t) => ({
        id: t.id,
        full_name: t.full_name,
        teacher_profiles: t.teacher_profiles ?? null,
      })));
      setSubjects(subjectData);
      setAssignments(assignmentData);
      setMatrixClass((prev) => prev ?? sectionData[0]?.class_num ?? null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load class structure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // Two staff with the same name would otherwise be identical options here,
  // and picking the wrong one silently assigns the class to a teacher who
  // never sees it. See lib/teacherLabel.ts.
  const teacherLabels = useMemo(() => buildTeacherLabels(teachers), [teachers]);
  const duplicateNames = useMemo(() => duplicateTeacherNames(teachers), [teachers]);

  const sectionsByClass = useMemo(() => {
    const map = new Map<number, SectionRow[]>();
    for (const s of sections) {
      if (!map.has(s.class_num)) map.set(s.class_num, []);
      map.get(s.class_num)!.push(s);
    }
    return map;
  }, [sections]);

  const classesWithSections = useMemo(() => [...sectionsByClass.keys()].sort((a, b) => a - b), [sectionsByClass]);

  // All sections in one flat, sortable list (Class, then Section) rather than
  // one card-grid per class — a class with a single section no longer wastes
  // two empty grid columns next to it.
  const allSectionsSorted = useMemo(
    () => [...sections].sort((a, b) => a.class_num - b.class_num || a.section_label.localeCompare(b.section_label)),
    [sections],
  );
  const totalStudents = useMemo(() => sections.reduce((sum, s) => sum + s.studentCount, 0), [sections]);
  const assignedTeacherCount = useMemo(() => sections.filter((s) => s.class_teacher_id).length, [sections]);
  const totalMappedSubjects = assignments.length;

  const assignmentByCell = useMemo(() => {
    const map = new Map<string, AssignmentRow>();
    for (const a of assignments) map.set(`${a.class_section_id}|${a.subject}`, a);
    return map;
  }, [assignments]);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAdding(true);
    try {
      await api.post('/school-admin/class-sections', { classNum: newClass, sectionLabel: newLabel.trim() });
      setNewLabel('');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add section');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClassTeacherChange = async (sectionId: string, teacherId: string) => {
    setError('');
    try {
      await api.patch(`/school-admin/class-sections/${sectionId}`, { classTeacherId: teacherId || null });
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, class_teacher_id: teacherId || null, classTeacherName: teachers.find((t) => t.id === teacherId)?.full_name ?? null }
            : s,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to set class teacher');
    }
  };

  const handleMatrixChange = async (section: SectionRow, subject: string, teacherId: string) => {
    const cellKey = `${section.id}|${subject}`;
    const existing = assignmentByCell.get(cellKey);
    if (existing?.teacher_id === teacherId) return;

    setError('');
    setSavingCell(cellKey);
    try {
      // Switching teacher = remove the old mapping, then add the new one
      // (the unique key is per-teacher, so an upsert alone would keep both).
      if (existing) {
        await api.delete(`/school-admin/teaching-assignments/${existing.id}`);
        setAssignments((prev) => prev.filter((a) => a.id !== existing.id));
      }
      if (teacherId) {
        const created = await api.post<AssignmentRow>('/school-admin/teaching-assignments', {
          teacherId,
          classSectionId: section.id,
          subject,
        });
        setAssignments((prev) => [...prev.filter((a) => a.id !== created.id), created]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update assignment');
    } finally {
      setSavingCell(null);
    }
  };

  const matrixSections = matrixClass !== null ? (sectionsByClass.get(matrixClass) ?? []) : [];
  const matrixSubjects = matrixClass !== null ? subjects.filter((s) => s.class_num === matrixClass).map((s) => s.subject) : [];

  return (
    <div className="flex flex-col gap-5">
      <PortalPageHeader
        eyebrow="Academic structure"
        title="Classes & Sections"
        description="Define which sections each class has this academic year, assign class teachers, then map subject teachers below. Sections are also registered automatically when you import students."
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Sections" value={sections.length} hint={`across ${classesWithSections.length} classes`} icon={<LayoutGrid size={18} />} />
          <MetricCard label="Students placed" value={totalStudents} hint="in an active section" icon={<Users size={18} />} tone="sky" />
          <MetricCard
            label="Class teachers"
            value={`${assignedTeacherCount}/${sections.length}`}
            hint={sections.length - assignedTeacherCount > 0 ? `${sections.length - assignedTeacherCount} unassigned` : 'all assigned'}
            icon={assignedTeacherCount === sections.length && sections.length > 0 ? <UserCheck size={18} /> : <UserRoundX size={18} />}
            tone={sections.length > 0 && assignedTeacherCount === sections.length ? 'emerald' : 'amber'}
          />
          <MetricCard label="Subject mappings" value={totalMappedSubjects} hint="teacher ↔ section ↔ subject" icon={<BookOpenCheck size={18} />} tone="indigo" />
        </div>
      </PortalPageHeader>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Add section */}
      <div className="portal-toolbar">
        <span className="text-[12px] font-semibold text-slate-600 shrink-0">Add a section</span>
        <form onSubmit={handleAddSection} className="flex items-center gap-2.5">
          <select value={newClass} onChange={(e) => setNewClass(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none cursor-pointer focus:border-slate-500">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <input required value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Section (e.g. A)" maxLength={4}
            className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-slate-500 uppercase" />
          <button type="submit" disabled={isAdding}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-[13px] rounded-lg px-3.5 py-2 transition-all cursor-pointer">
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Section
          </button>
        </form>
        <div className="ml-auto rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
          {sections.length} section{sections.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* All sections, one dense table — Class + Section, students, class teacher */}
      <div className="portal-panel">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : allSectionsSorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <LayoutGrid size={28} strokeWidth={1.5} />
            <p className="text-[13px]">No sections yet — add one above, or import students and sections will appear automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="portal-table w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] text-slate-500">
                  <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap">Class &amp; Section</th>
                  <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap">Students</th>
                  <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap w-72">Class Teacher</th>
                </tr>
              </thead>
              <tbody>
                {allSectionsSorted.map((section) => (
                  <tr key={section.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                      Class {section.class_num}
                      <span className="ml-1.5 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                        {section.section_label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-slate-600 tabular-nums">
                      <span className="inline-flex items-center gap-1"><Users size={12} className="text-slate-400" /> {section.studentCount}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={section.class_teacher_id ?? ''}
                        onChange={(e) => void handleClassTeacherChange(section.id, e.target.value)}
                        className={`w-full max-w-64 px-2.5 py-1.5 border rounded-lg outline-none text-[13px] focus:border-slate-500 cursor-pointer ${
                          section.class_teacher_id ? 'bg-white border-slate-200 text-slate-700' : 'bg-amber-50/60 border-amber-200 text-amber-800'
                        }`}
                      >
                        <option value="">— Not assigned —</option>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{teacherLabels.get(t.id) ?? t.full_name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subject-teacher matrix */}
      <div className="portal-panel p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">Subject Teachers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Assign which teacher teaches each subject to each section. This is what scopes a teacher's tasks, exams and student lists.
          </p>
        </div>

        {duplicateNames.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800">
            <TriangleAlert size={14} className="mt-px shrink-0" />
            <span>
              More than one staff account is named{' '}
              <span className="font-semibold">{duplicateNames.join(', ')}</span>. They're shown below with an
              employee ID or subject in brackets so you can tell them apart — assigning the wrong one means that
              teacher won't see the class in their portal. If these are duplicates, remove the extra account under
              Teachers.
            </span>
          </div>
        )}

        {classesWithSections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {classesWithSections.map((c) => (
              <button key={c} onClick={() => setMatrixClass(c)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixClass === c ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                Class {c}
              </button>
            ))}
          </div>
        )}

        {matrixClass !== null && matrixSections.length > 0 && (
          matrixSubjects.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No subjects configured for Class {matrixClass}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                    <th className="pb-2 pr-4">Subject</th>
                    {matrixSections.map((s) => (
                      <th key={s.id} className="pb-2 pr-3">{matrixClass}-{s.section_label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixSubjects.map((subject) => (
                    <tr key={subject} className="border-b border-slate-50">
                      <td className="py-2.5 pr-4 font-semibold text-slate-700 whitespace-nowrap">{subject}</td>
                      {matrixSections.map((section) => {
                        const cellKey = `${section.id}|${subject}`;
                        const assignment = assignmentByCell.get(cellKey);
                        return (
                          <td key={section.id} className="py-2 pr-3">
                            <select
                              value={assignment?.teacher_id ?? ''}
                              disabled={savingCell === cellKey}
                              onChange={(e) => void handleMatrixChange(section, subject, e.target.value)}
                              className={`w-full min-w-32 px-2 py-1.5 border rounded-lg outline-none text-xs focus:border-rose-400 ${
                                assignment ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                              } ${savingCell === cellKey ? 'opacity-50' : ''}`}
                            >
                              <option value="">—</option>
                              {teachers.map((t) => <option key={t.id} value={t.id}>{teacherLabels.get(t.id) ?? t.full_name}</option>)}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};
