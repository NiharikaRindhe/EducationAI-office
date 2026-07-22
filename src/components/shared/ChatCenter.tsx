import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Loader2, AlertCircle, Plus, BookOpen, Image as ImageIcon } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// One AI doubt-solver experience for Batch 2 and 3 — only the accent color
// changes. Real RAG chat: session per subject, history persisted, sources
// cited from the actual NCERT chunks the backend retrieved.

type Accent = 'indigo' | 'sky';

const ACCENT = {
  indigo: { bg: 'bg-indigo-600 hover:bg-indigo-700', bubble: 'bg-indigo-600', soft: 'bg-indigo-50', text: 'text-indigo-600', ring: 'focus:border-indigo-500 focus:ring-indigo-500/10', spinner: 'text-indigo-400' },
  sky: { bg: 'bg-sky-500 hover:bg-sky-600', bubble: 'bg-sky-500', soft: 'bg-sky-50', text: 'text-sky-600', ring: 'focus:border-sky-500 focus:ring-sky-500/10', spinner: 'text-sky-400' },
} as const;

interface ChatSession {
  id: string;
  class_num: number;
  subject: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  sources: { bookTitle: string; chapter: string | null; page: number | null; excerpt: string }[] | null;
  returned_images: { url: string; caption: string | null; chapter: string | null; page: number | null }[] | null;
  created_at: string;
}

export const ChatCenter: React.FC<{ accent: Accent }> = ({ accent }) => {
  const a = ACCENT[accent];
  const { user } = useAuth();
  const classNum = user?.student_profiles?.class_num ?? 0;
  const [subjects, setSubjects] = useState<string[] | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadSidebar = useCallback(async () => {
    try {
      const [subjectList, sessionList] = await Promise.all([
        api.get<string[]>('/student/subjects'),
        api.get<ChatSession[]>('/student/chat/sessions'),
      ]);
      setSubjects(subjectList);
      setSessions(sessionList);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load chat');
    }
  }, []);

  useEffect(() => { void loadSidebar(); }, [loadSidebar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openSession = async (sessionId: string) => {
    setError('');
    setActiveSessionId(sessionId);
    try {
      setMessages(await api.get<ChatMessage[]>(`/student/chat/sessions/${sessionId}/history`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load conversation');
    }
  };

  const startSession = async (subject: string) => {
    setError('');
    try {
      const session = await api.post<ChatSession>('/student/chat/sessions', { classNum, subject });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to start a new chat');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeSessionId) return;
    setInput('');
    setError('');

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      sources: null,
      returned_images: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setIsSending(true);
    try {
      const result = await api.post<{
        answer: string;
        sources: { bookTitle: string; chapter: string | null; page: number | null; excerpt: string }[];
        returnedImages: { url: string; caption: string | null; chapter: string | null; page: number | null }[];
      }>(`/student/chat/sessions/${activeSessionId}/message`, { text });

      setMessages((prev) => [
        ...prev,
        {
          id: `local-ai-${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          returned_images: result.returnedImages,
          created_at: new Date().toISOString(),
        },
      ]);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, updated_at: new Date().toISOString() } : s)),
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.code === 'RATE_LIMITED'
          ? "You've reached today's question limit (50/day) — try again tomorrow."
          : err instanceof ApiClientError
            ? err.message
            : 'Failed to send message';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
      {/* Sidebar: subjects + past sessions */}
      <div className="col-span-12 md:col-span-3 bg-white border border-slate-100 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          <span className="text-[9px] font-label-caps text-slate-400 tracking-wider block mb-2">NEW CHAT</span>
          <div className="flex flex-col gap-1.5">
            {subjects === null ? (
              <Loader2 size={14} className={`animate-spin ${a.spinner}`} />
            ) : subjects.length === 0 ? (
              <p className="text-[11px] text-slate-400">No subjects configured for your class yet.</p>
            ) : (
              subjects.map((subject) => (
                <button key={subject} onClick={() => void startSession(subject)}
                  className="flex items-center gap-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl transition-all cursor-pointer">
                  <Plus size={12} className={a.text} /> {subject}
                </button>
              ))
            )}
          </div>
        </div>

        {sessions.length > 0 && (
          <div>
            <span className="text-[9px] font-label-caps text-slate-400 tracking-wider block mb-2">HISTORY</span>
            <div className="flex flex-col gap-1">
              {sessions.map((s) => (
                <button key={s.id} onClick={() => void openSession(s.id)}
                  className={`text-left text-xs px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    activeSessionId === s.id ? `${a.soft} font-bold text-slate-800` : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                  {s.subject}
                  <span className="block text-[9px] text-slate-400 font-normal">
                    {new Date(s.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      <div className="col-span-12 md:col-span-9 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
            <BookOpen size={28} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-500">Pick a subject to start asking questions</p>
            <p className="text-xs text-slate-400">Answers are grounded in your NCERT textbook — with page citations.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      isUser ? `${a.bubble} text-white rounded-tr-sm` : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, i) => (
                          <span key={i} title={src.excerpt} className={`text-[9px] font-bold px-2 py-1 rounded-lg ${a.soft} ${a.text}`}>
                            📖 {src.bookTitle}{src.chapter ? `, ${src.chapter}` : ''}{src.page ? `, Pg${src.page}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isUser && msg.returned_images && msg.returned_images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.returned_images.map((img, i) => (
                          <a key={i} href={img.url} target="_blank" rel="noreferrer"
                            className="block w-40 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                            <img src={img.url} alt={img.caption ?? 'Textbook diagram'} loading="lazy"
                              className="w-full h-28 object-contain bg-white" />
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 px-2 py-1.5">
                              <ImageIcon size={10} className="shrink-0" />
                              <span className="truncate">
                                {img.caption ?? 'Diagram'}{img.page ? ` · Pg${img.page}` : ''}
                              </span>
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {isSending && (
                <div className="self-start flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                  <Loader2 size={12} className="animate-spin" /> Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="mx-4 mb-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-2.5 flex items-center gap-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about this subject…"
                disabled={isSending}
                className={`flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none transition-all ${a.ring}`}
              />
              <button type="submit" disabled={isSending || !input.trim()}
                className={`w-11 h-11 ${a.bg} disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer`}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
