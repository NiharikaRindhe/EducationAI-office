import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Loader2, AlertCircle, Radio, Hand, Square, Users, FlaskConical,
  ClipboardCheck, Copy, Check, Timer, X,
} from 'lucide-react';
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

interface Lab {
  id: string;
  name: string;
  seat_capacity: number;
  is_active: boolean;
}

interface LiveSession {
  id: string;
  class_num: number;
  section: string;
  subject: string | null;
  started_at: string;
  /** Present only for a lab session — see the 20250101000173 migration. */
  join_code: string | null;
  lab_id: string | null;
  ends_at_expected: string | null;
}

interface Participant {
  student_id: string;
  joined_at: string;
  left_at: string | null;
  raised_hand: boolean;
  student_profiles: { avatar: string; user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

interface AttendanceRow {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  joined_at: string | null;
  left_at: string | null;
  marked_by_teacher: boolean;
  attended: boolean;
}

interface AttendancePayload {
  present: number;
  total: number;
  rows: AttendanceRow[];
}

const participantName = (p: Participant): string => {
  const up = p.student_profiles?.user_profiles;
  if (!up) return 'Student';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'Student') : up.full_name;
};

/**
 * Counts down to the scheduled end of the period.
 *
 * Ticks locally rather than polling: the end time is fixed when the session
 * starts, so asking the server every second would tell us nothing new. Goes
 * amber in the last five minutes and keeps counting upward once overrun,
 * because a session left running is exactly what this is meant to make visible.
 */
const Countdown: React.FC<{ endsAt: string }> = ({ endsAt }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const msLeft = new Date(endsAt).getTime() - now;
  const overrun = msLeft < 0;
  const total = Math.abs(Math.floor(msLeft / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const urgent = !overrun && msLeft < 5 * 60 * 1000;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${
        overrun ? 'bg-rose-50 text-rose-700' : urgent ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
      }`}
      title={overrun ? 'The scheduled period has already ended' : 'Time left in this period'}
    >
      <Timer size={13} />
      {overrun ? '+' : ''}{mins}:{String(secs).padStart(2, '0')}
      {overrun && <span className="font-semibold">over</span>}
    </span>
  );
};

export const TeacherLiveSession: React.FC = () => {
  const [mySections, setMySections] = useState<MySections | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState('');

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const pollRef = useRef<number | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [attendance, setAttendance] = useState<AttendancePayload | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sections, active, labList] = await Promise.all([
        api.get<MySections>('/teacher/my-sections'),
        api.get<LiveSession | null>('/teacher/sessions/active'),
        // A school with no labs, or a teacher without access, still gets the
        // rest of the page rather than an error.
        api.get<Lab[]>('/teacher/labs').catch(() => [] as Lab[]),
      ]);
      setMySections(sections);
      setSession(active);
      setLabs(labList.filter((l) => l.is_active));
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

  const labName = useMemo(
    () => labs.find((l) => l.id === session?.lab_id)?.name ?? null,
    [labs, session],
  );

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
        labId: selectedLabId || undefined,
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
      setShowRegister(false);
      setAttendance(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  const loadAttendance = useCallback(async () => {
    if (!session) return;
    try {
      setAttendance(await api.get<AttendancePayload>(`/teacher/sessions/${session.id}/attendance`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load the register');
    }
  }, [session]);

  const openRegister = async () => {
    setShowRegister(true);
    setAttendance(null);
    await loadAttendance();
  };

  /** Mark a student who could not join themselves. A machine that will not
   *  connect is common enough in a lab that without this the register lies. */
  const toggleAttendance = async (row: AttendanceRow) => {
    if (!session) return;
    setMarkingId(row.student_id);
    try {
      await api.post(`/teacher/sessions/${session.id}/attendance`, {
        studentId: row.student_id,
        present: !row.attended,
      });
      await loadAttendance();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update the register');
    } finally {
      setMarkingId(null);
    }
  };

  const copyCode = async () => {
    if (!session?.join_code) return;
    try {
      await navigator.clipboard.writeText(session.join_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked — the code is on screen to read out anyway. */
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
          <button onClick={() => setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {!session ? (
        /* No session yet — start one. */
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
              {/* Choosing a lab is what makes this a lab session: it gets a join
                  code for students arriving from other sections, and a
                  countdown to the end of the timetabled period. */}
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                disabled={labs.length === 0}
                title={labs.length === 0 ? 'No labs registered for this school yet' : undefined}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">In the classroom (no lab)</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.seat_capacity} seats</option>)}
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
        <>
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2 flex-wrap">
                  Class {session.class_num}-{session.section} is live{session.subject ? ` — ${session.subject}` : ''}
                  {labName && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                      <FlaskConical size={11} /> {labName}
                    </span>
                  )}
                  {session.ends_at_expected && <Countdown endsAt={session.ends_at_expected} />}
                </h2>
                <p className="text-xs text-slate-400">
                  Started {new Date(session.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{joined.length} joined{raisedHands.length > 0 ? ` · ${raisedHands.length} hand${raisedHands.length === 1 ? '' : 's'} raised` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void openRegister()}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer"
              >
                <ClipboardCheck size={14} /> Attendance
              </button>
              <button
                onClick={() => void handleEnd()}
                disabled={isEnding}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer"
              >
                {isEnding ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                End Session
              </button>
            </div>
          </div>

          {/* The join code, sized to be read from the back of a lab. Only a lab
              session has one — a classroom session is gated by the roster. */}
          {session.join_code && (
            <div className="bg-slate-900 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Session code</p>
                <p className="mt-1 font-mono text-5xl font-black tracking-[0.2em] text-white">{session.join_code}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Students type this on their Home screen to join — useful when the group is not one whole section.
                </p>
              </div>
              <button
                onClick={() => void copyCode()}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
          )}

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

      {/* Attendance register — the whole roster, so absentees are rows to act
          on rather than names the teacher has to notice are missing. */}
      {showRegister && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-slate-800">
                  Attendance · Class {session.class_num}-{session.section}
                </h2>
                {attendance && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {attendance.present} of {attendance.total} present
                  </p>
                )}
              </div>
              <button onClick={() => setShowRegister(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={17} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!attendance ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : attendance.rows.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No students on this section&apos;s roster.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {attendance.rows.map((r) => (
                    <li key={r.student_id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                      <span className="w-10 shrink-0 font-mono text-[11px] text-slate-400">{r.roll_number ?? '—'}</span>
                      <span className="flex-1 truncate text-[13px] font-semibold text-slate-700">{r.full_name}</span>
                      {r.attended && (
                        <span className="text-[11px] text-slate-400">
                          {r.marked_by_teacher
                            ? 'marked'
                            : r.joined_at
                              ? new Date(r.joined_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                        </span>
                      )}
                      <button
                        onClick={() => void toggleAttendance(r)}
                        disabled={markingId === r.student_id}
                        className={`w-24 shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 ${
                          r.attended
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {markingId === r.student_id ? '…' : r.attended ? 'Present' : 'Mark present'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button onClick={() => setShowRegister(false)} className="rounded-lg bg-slate-900 px-5 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
