import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Send, CheckCircle2, ClipboardList } from 'lucide-react';
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

interface TaskRow {
  id: string;
  title: string;
  subject: string;
  task_type: string;
  xp_reward: number;
  due_date: string | null;
  created_at: string;
  totalAssigned: number;
  completed: number;
}

const TASK_TYPES = [
  { value: 'custom', label: 'Custom' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'reading', label: 'Reading' },
  { value: 'practice', label: 'Practice' },
  { value: 'pyq', label: 'PYQ' },
] as const;

export const TeacherAssignTasks: React.FC = () => {
  const [mySections, setMySections] = useState<MySections | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [taskType, setTaskType] = useState<string>('custom');
  const [instructions, setInstructions] = useState('');
  const [xpReward, setXpReward] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sections, taskData] = await Promise.all([
        api.get<MySections>('/teacher/my-sections'),
        api.get<TaskRow[]>('/teacher/tasks'),
      ]);
      setMySections(sections);
      setTasks(taskData);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load your sections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const toggleSection = (id: string) => {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Subjects valid for EVERY selected section's class — a task tagged with a
  // subject must not reach a class that doesn't have that subject.
  const subjectOptions = useMemo(() => {
    if (!mySections) return [];
    const selected = mySections.sections.filter((s) => selectedSectionIds.has(s.classSectionId));
    if (selected.length === 0) return [];
    const classNums = [...new Set(selected.map((s) => s.classNum))];
    const lists = classNums.map((c) => mySections.subjectsByClass[c] ?? []);
    return (lists[0] ?? []).filter((subj) => lists.every((list) => list.includes(subj)));
  }, [mySections, selectedSectionIds]);

  useEffect(() => {
    if (subject && !subjectOptions.includes(subject)) setSubject('');
  }, [subjectOptions, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSectionIds.size === 0) {
      setError('Select at least one section to assign this task to.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      const result = await api.post<{ task: { id: string }; assignedCount: number }>('/teacher/tasks', {
        title,
        subject,
        taskType,
        instructions: instructions || undefined,
        xpReward,
        dueDate: dueDate || undefined,
        assignTo: { mode: 'sections', sectionIds: [...selectedSectionIds] },
      });
      setSuccessMessage(`Task assigned to ${result.assignedCount} student${result.assignedCount === 1 ? '' : 's'}.`);
      setTitle('');
      setInstructions('');
      setDueDate('');
      setSelectedSectionIds(new Set());
      const taskData = await api.get<TaskRow[]>('/teacher/tasks');
      setTasks(taskData);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to assign task');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={14} /> {successMessage}
        </div>
      )}

      {/* Create + assign */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">New Task</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pick one or more of your sections — the same task goes to every selected section. Create separate tasks to give sections different work.
          </p>
        </div>

        {mySections && mySections.sections.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No sections are mapped to you yet — ask your School Admin to assign you on the Classes &amp; Sections page.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Section picker */}
            <div>
              <label className="text-[9px] font-label-caps text-slate-400 tracking-wider block mb-2">ASSIGN TO SECTIONS</label>
              <div className="flex flex-wrap gap-2">
                {mySections?.sections.map((s) => {
                  const isSelected = selectedSectionIds.has(s.classSectionId);
                  return (
                    <button
                      type="button"
                      key={s.classSectionId}
                      onClick={() => toggleSection(s.classSectionId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {s.classNum}-{s.section}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title (e.g. Read Chapter 4 — Nutrition in Plants)"
                className="md:col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />

              <select required value={subject} onChange={(e) => setSubject(e.target.value)} disabled={selectedSectionIds.size === 0}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">{selectedSectionIds.size === 0 ? 'Select sections first' : 'Subject'}</option>
                {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
                {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 whitespace-nowrap">XP reward</label>
                <input type="number" min={0} max={1000} value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))}
                  className="w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 whitespace-nowrap">Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
              </div>

              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions (optional)" rows={3}
                className="md:col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 resize-none" />
            </div>

            <button type="submit" disabled={isSubmitting}
              className="self-start flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Assign Task
            </button>
          </form>
        )}
      </div>

      {/* Existing tasks */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <ClipboardList size={17} className="text-indigo-500" /> My Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No tasks yet — assign your first one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Title</th><th className="pb-2">Subject</th><th className="pb-2">Type</th><th className="pb-2">XP</th><th className="pb-2">Due</th><th className="pb-2">Progress</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">{t.title}</td>
                    <td className="py-2.5">{t.subject}</td>
                    <td className="py-2.5 capitalize">{t.task_type}</td>
                    <td className="py-2.5">{t.xp_reward}</td>
                    <td className="py-2.5">{t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td className="py-2.5">
                      <span className={`font-bold ${t.completed === t.totalAssigned && t.totalAssigned > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {t.completed}/{t.totalAssigned}
                      </span>{' '}
                      completed
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
