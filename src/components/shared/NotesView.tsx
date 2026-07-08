import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

type Accent = 'indigo' | 'sky';

const ACCENT = {
  indigo: { active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10', btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:border-indigo-500', pill: 'pill-indigo', spinner: 'text-indigo-400' },
  sky: { active: 'bg-sky-500 text-white shadow-md shadow-sky-500/10', btn: 'bg-sky-500 hover:bg-sky-600', ring: 'focus:border-sky-500', pill: 'pill-sky', spinner: 'text-sky-400' },
} as const;

interface Note {
  id: string;
  title: string;
  content: string | null;
  subject: string | null;
  tags: string[];
  is_board_tagged: boolean;
  updated_at: string;
}

export const NotesView: React.FC<{ accent: Accent }> = ({ accent }) => {
  const a = ACCENT[accent];
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [openNote, setOpenNote] = useState<Note | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [noteList, subjectList] = await Promise.all([
        api.get<Note[]>('/student/notes'),
        api.get<string[]>('/student/subjects'),
      ]);
      setNotes(noteList);
      setSubjects(subjectList);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load notes');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = (notes ?? []).filter((n) => activeSubject === 'All' || n.subject === activeSubject);
  const subjectTabs = ['All', ...subjects];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await api.post('/student/notes', { title, subject: subject || undefined, content: content || undefined });
      setTitle(''); setSubject(''); setContent('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await api.delete(`/student/notes/${id}`);
      setOpenNote(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete note');
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans anim-fade-up">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex gap-2 flex-wrap">
          {subjectTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveSubject(tab)}
              className={`py-2 px-5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeSubject === tab ? a.active : 'text-slate-400 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)}
          className={`py-2.5 px-4 rounded-xl ${a.btn} text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5`}>
          <Plus size={14} /> New Note
        </button>
      </div>

      {notes === null ? (
        <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.spinner}`} /></div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-12">No notes yet — write your first one.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((note) => (
            <button key={note.id} onClick={() => setOpenNote(note)}
              className="bento-card border border-slate-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left cursor-pointer">
              <div>
                <div className="flex justify-between items-start">
                  {note.subject && <span className={`badge ${a.pill} text-[9px] font-black`}>{note.subject}</span>}
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(note.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-800 mt-2.5">{note.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-2.5 whitespace-pre-line line-clamp-3">
                  {note.content}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New note modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 anim-fade-up">
            <h3 className="font-display font-bold text-sm text-slate-800">Create New Note</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[9px] font-bold text-slate-400">TITLE</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none ${a.ring}`}
                  placeholder="e.g. Newton's Laws of Motion" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[9px] font-bold text-slate-400">SUBJECT</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none ${a.ring}`}>
                  <option value="">No subject</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[9px] font-bold text-slate-400">CONTENT</label>
                <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none ${a.ring}`}
                  placeholder="Write your study notes here..." />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className={`flex-1 py-3 ${a.btn} disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-2`}>
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : null} Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/delete modal */}
      {openNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 anim-fade-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                {openNote.subject && <span className={`badge ${a.pill} text-[9px] font-black`}>{openNote.subject}</span>}
                <h3 className="font-display font-bold text-lg text-slate-800 mt-2">{openNote.title}</h3>
              </div>
              <button onClick={() => setOpenNote(null)} className="text-slate-300 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{openNote.content}</p>
            <button onClick={() => void handleDelete(openNote.id)}
              className="self-start flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl cursor-pointer">
              <Trash2 size={13} /> Delete Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
