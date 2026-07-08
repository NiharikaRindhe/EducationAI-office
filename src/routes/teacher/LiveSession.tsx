import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, Radio, Hand, Square, Users } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface TeachingSection {
  classSectionId: string;
  classNum: number;
  section: string;
  subjects: string[];
  isClassTeacher: boolean;
}

interface MySections {
  sections: TeachingSection[];
  legacyFallback: boolean;
  subjectsByClass: Record<number, string[]>;
}

interface LiveSession {
  id: string;
  class_num: number;
  section: string;
  subject: string | null;
  started_at: string;
}

interface Participant {
  student_id: string;
  joined_at: string;
  left_at: string | null;
  raised_hand: boolean;
  student_profiles: { avatar: string; user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

const participantName = (p: Participant): string => {
  const up = p.student_profiles?.user_profiles;
  if (!up) return 'Student';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'Student') : up.full_name;
};

export const TeacherLiveSession: React.FC = () => {
  const [mySections, setMySections] = useState<MySections | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState('');

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const pollRef = useRef<number | null>(null);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sections, active] = await Promise.all([
        api.get<MySections>('/teacher/my-sections'),
        api.get<LiveSession | null>('/teacher/sessions/active'),
      ]);
      setMySections(sections);
      setSession(active);
      if (sections.sections.length > 0 && !active) {
        setSelectedSectionId(sections.sections[0].classSectionId);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load your sections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadInitial(); }, [loadInitial]);

  // Poll the participant list every 5s while a session is live — the lab
  // screen usually stays open on this page for the whole period.
  useEffect(() => {
    if (!session) {
      setParticipants([]);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await api.get<Participant[]>(`/teacher/sessions/${session.id}/participants`);
        if (!cancelled) setParticipants(data);
      } catch {
        /* transient poll failure — keep the last list */
      }
    };
    void poll();
    pollRef.current = window.setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, [session]);

  const selectedSection = mySections?.sections.find((s) => s.classSectionId === selectedSectionId);
  const subjectOptions = selectedSection
    ? (selectedSection.subjects.length > 0
        ? selectedSection.subjects
        : (mySections?.subjectsByClass[selectedSection.classNum] ?? []))
    : [];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;
    setError('');
    setIsStarting(true);
    try {
      const started = await api.post<LiveSession>('/teacher/sessions/start', {
        classNum: selectedSection.classNum,
        section: selectedSection.section,
        subject: selectedSubject || undefined,
      });
      setSession(started);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to start session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    setError('');
    setIsEnding(true);
    try {
      await api.post(`/teacher/sessions/${session.id}/end`);
      setSession(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  const joined = participants.filter((p) => !p.left_at);
  const raisedHands = joined.filter((p) => p.raised_hand);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {!session ? (
        /* ─── No session: start one ─── */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-800">Start a Lab Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Students of the selected section can then join from their screens. Class 1–4 students can only log in with their PIN while your session is live.
            </p>
          </div>

          {mySections && mySections.sections.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No sections are mapped to you yet — ask your School Admin to assign you on the Classes &amp; Sections page.
            </p>
          ) : (
            <form onSubmit={handleStart} className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSectionId}
                onChange={(e) => { setSelectedSectionId(e.target.value); setSelectedSubject(''); }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400"
              >
                {mySections?.sections.map((s) => (
                  <option key={s.classSectionId} value={s.classSectionId}>
                    Class {s.classNum}-{s.section}{s.isClassTeacher ? ' (class teacher)' : ''}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400"
              >
                <option value="">Subject (optional)</option>
                {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <button
                type="submit"
                disabled={isStarting || !selectedSection}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer"
              >
                {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                Start Session
              </button>
            </form>
          )}
        </div>
      ) : (
        /* ─── Live session panel ─── */
        <>
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <h2 className="font-display font-bold text-lg text-slate-800">
                  Class {session.class_num}-{session.section} is live{session.subject ? ` — ${session.subject}` : ''}
                </h2>
                <p className="text-xs text-slate-400">
                  Started {new Date(session.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{joined.length} joined{raisedHands.length > 0 ? ` · ${raisedHands.length} hand${raisedHands.length === 1 ? '' : 's'} raised` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => void handleEnd()}
              disabled={isEnding}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer"
            >
              {isEnding ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
              End Session
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <Users size={15} className="text-indigo-500" /> Joined Students ({joined.length})
            </h3>
            {joined.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No one has joined yet — students will appear here as they log in and join.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...joined]
                  .sort((a, b) => Number(b.raised_hand) - Number(a.raised_hand))
                  .map((p) => (
                    <div
                      key={p.student_id}
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 ${
                        p.raised_hand ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <span className="text-xl">{p.student_profiles?.avatar ?? '🙂'}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate flex-1">{participantName(p)}</span>
                      {p.raised_hand && <Hand size={14} className="text-amber-500 shrink-0" />}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
