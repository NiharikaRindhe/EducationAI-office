import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Plus, AlertCircle, Users } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

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
        api.get<{ id: string; full_name: string }[]>('/school-admin/teachers'),
        api.get<SubjectRow[]>('/school-admin/subjects'),
        api.get<AssignmentRow[]>('/school-admin/teaching-assignments'),
      ]);
      setSections(sectionData);
      setTeachers(teacherData.map((t) => ({ id: t.id, full_name: t.full_name })));
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

  const sectionsByClass = useMemo(() => {
    const map = new Map<number, SectionRow[]>();
    for (const s of sections) {
      if (!map.has(s.class_num)) map.set(s.class_num, []);
      map.get(s.class_num)!.push(s);
    }
    return map;
  }, [sections]);

  const classesWithSections = useMemo(() => [...sectionsByClass.keys()].sort((a, b) => a - b), [sectionsByClass]);

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
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Add section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">Classes &amp; Sections</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define which sections each class has this academic year. Sections are also registered automatically when you import students.
          </p>
        </div>
        <form onSubmit={handleAddSection} className="flex items-center gap-3">
          <select value={newClass} onChange={(e) => setNewClass(Number(e.target.value))}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <input required value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Section (e.g. A)" maxLength={4}
            className="w-36 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400 uppercase" />
          <button type="submit" disabled={isAdding}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer">
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Section
          </button>
        </form>
      </div>

      {/* Sections grouped by class, with class-teacher assignment */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-rose-400" /></div>
        ) : classesWithSections.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No sections yet — add one above, or import students and sections will appear automatically.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {classesWithSections.map((classNum) => (
              <div key={classNum}>
                <h3 className="font-display font-bold text-sm text-slate-700 mb-2">Class {classNum}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {sectionsByClass.get(classNum)!.map((section) => (
                    <div key={section.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-slate-800">
                          {classNum}-{section.section_label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Users size={11} /> {section.studentCount} student{section.studentCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <label className="text-[9px] font-label-caps text-slate-400 tracking-wider mt-1">CLASS TEACHER</label>
                      <select
                        value={section.class_teacher_id ?? ''}
                        onChange={(e) => void handleClassTeacherChange(section.id, e.target.value)}
                        className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400"
                      >
                        <option value="">— Not assigned —</option>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-teacher matrix */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">Subject Teachers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Assign which teacher teaches each subject to each section. This is what scopes a teacher's tasks, exams and student lists.
          </p>
        </div>

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
                              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
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
