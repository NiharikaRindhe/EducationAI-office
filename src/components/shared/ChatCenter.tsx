import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Loader2, AlertCircle, Plus, BookOpen, Image as ImageIcon, Camera, X, Pencil, Trash2, Info, ShieldCheck, MessageSquareText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { api, ApiClientError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// One AI doubt-solver experience for Batch 2 and 3 — only the accent color
// changes. Real RAG chat: session per subject, history persisted, sources
// cited from the actual NCERT chunks the backend retrieved.

type Accent = 'indigo' | 'teal' | 'sky';

const ACCENT = {
  indigo: { bg: 'bg-indigo-600 hover:bg-indigo-700', bubble: 'bg-indigo-600', soft: 'bg-indigo-50', text: 'text-indigo-600', ring: 'focus:border-indigo-500 focus:ring-indigo-500/10', spinner: 'text-indigo-400' },
  teal: { bg: 'bg-teal-700 hover:bg-teal-800', bubble: 'bg-teal-700', soft: 'bg-teal-50', text: 'text-teal-700', ring: 'focus:border-teal-600 focus:ring-teal-600/10', spinner: 'text-teal-500' },
  sky: { bg: 'bg-sky-500 hover:bg-sky-600', bubble: 'bg-sky-500', soft: 'bg-sky-50', text: 'text-sky-600', ring: 'focus:border-sky-500 focus:ring-sky-500/10', spinner: 'text-sky-400' },
} as const;

interface ChatSession {
  id: string;
  class_num: number;
  subject: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/** Every session belongs to exactly one subject by design (that's what scopes
 *  its RAG retrieval) — a custom title is just a friendlier label over that,
 *  never a replacement for it. */
const sessionLabel = (s: ChatSession) => s.title?.trim() || s.subject;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  sources: { bookTitle: string; chapter: string | null; page: number | null; excerpt: string }[] | null;
  returned_images: { url: string; caption: string | null; chapter: string | null; page: number | null }[] | null;
  image_url?: string | null;
  subject_warning?: string | null;
  created_at: string;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // matches the API's sendMessageSchema limit

/** A textbook question is just as often a photo as typed text — this reads a
 *  picked/pasted/dropped file into both a data URL (instant local preview,
 *  before the network round-trip) and the plain base64 payload the API
 *  actually wants (no data: prefix, per sendMessageSchema). */
function readImageFile(file: File): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file is not an image'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image too large — keep photos under 4MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      resolve({ dataUrl, base64 });
    };
    reader.onerror = () => reject(new Error('Failed to read the image'));
    reader.readAsDataURL(file);
  });
}

// The tutor is told to use $...$ / $$...$$ (what remark-math parses), but
// models routinely emit the \(...\) / \[...\] convention instead regardless
// of the instruction — normalize both to the one remark-math understands
// rather than leaving raw backslash-bracket LaTeX unrendered in the bubble.
// Lookbehind excludes \\[ / \\] specifically: that's LaTeX's OWN row-break-
// with-spacing syntax inside \begin{aligned}...\end{aligned} blocks (e.g.
// `\\[4pt]`), not a display-math delimiter — a naive replace mangled it into
// a stray "$$" mid-equation and broke KaTeX parsing of the whole block.
function normalizeLatexDelimiters(text: string): string {
  return text
    .replace(/(?<!\\)\\\[/g, '$$$$')
    .replace(/(?<!\\)\\\]/g, '$$$$')
    .replace(/(?<!\\)\\\(/g, '$')
    .replace(/(?<!\\)\\\)/g, '$');
}

// Tailwind has no typography plugin installed here, so markdown elements are
// styled directly via arbitrary-variant child selectors on this one wrapper
// instead of pulling in a whole prose stylesheet for one component.
const MARKDOWN_STYLES =
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 ' +
  '[&_h1]:text-sm [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1:first-child]:mt-0 ' +
  '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2:first-child]:mt-0 ' +
  '[&_h3]:text-xs [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3:first-child]:mt-0 ' +
  '[&_strong]:font-bold [&_em]:italic ' +
  '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5 [&_ul]:space-y-0.5 ' +
  '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1.5 [&_ol]:space-y-0.5 ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:text-slate-500 ' +
  '[&_hr]:my-3 [&_hr]:border-slate-200 ' +
  '[&_a]:underline [&_a]:font-semibold ' +
  '[&_code]:bg-slate-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[10px] [&_code]:font-mono ' +
  '[&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:p-2.5 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
  '[&_table]:my-2 [&_table]:border-collapse [&_table]:text-[11px] [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full ' +
  '[&_th]:border [&_th]:border-slate-200 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-slate-100 [&_th]:text-left [&_th]:font-bold ' +
  '[&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top ' +
  '[&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex]:text-[13px]';

const MarkdownAnswer: React.FC<{ content: string }> = ({ content }) => (
  <div className={MARKDOWN_STYLES}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
    >
      {normalizeLatexDelimiters(content)}
    </ReactMarkdown>
  </div>
);

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
  // Storage can 404 a figure (object deleted post-ingest, transient network
  // blip) even though the backend vouched for it as relevant — a broken-image
  // icon in the middle of an answer reads as "the app is broken," not "one
  // picture didn't load." Track failures and drop just that image instead.
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const startRename = (s: ChatSession) => {
    setError('');
    setRenamingSessionId(s.id);
    setRenameValue(sessionLabel(s));
  };

  const commitRename = async () => {
    const sessionId = renamingSessionId;
    const title = renameValue.trim();
    if (!sessionId) return;
    setRenamingSessionId(null);
    if (!title) return; // empty edit is a no-op, not a request to clear the title
    try {
      const updated = await api.patch<ChatSession>(`/student/chat/sessions/${sessionId}`, { title });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to rename chat');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/student/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete chat');
    }
  };

  const attachImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    setError('');
    try {
      setPendingImage(await readImageFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read the image');
    }
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    void attachImageFile(e.target.files?.[0]);
    e.target.value = ''; // allow choosing the same file again later
  };

  // Snapping a textbook problem is often a phone screenshot pasted straight
  // from the clipboard — supporting Ctrl+V here means no save-then-browse
  // detour just to ask about one question.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    void attachImageFile(item.getAsFile());
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !pendingImage) || !activeSessionId) return;
    setInput('');
    const imageToSend = pendingImage;
    setPendingImage(null);
    setError('');

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      sources: null,
      returned_images: null,
      image_url: imageToSend?.dataUrl ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setIsSending(true);

    // Streamed in token-by-token (see api.postStream / chat.service.ts) —
    // this placeholder's content grows in place as chunks arrive, rather
    // than the student watching a spinner for the whole retrieval-plus-
    // completion round trip before anything appears.
    const replyId = `local-ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: 'assistant', content: '', sources: null, returned_images: null, created_at: new Date().toISOString() },
    ]);

    try {
      const done = await api.postStream<
        { bookTitle: string; chapter: string | null; page: number | null; excerpt: string },
        { url: string; caption: string | null; chapter: string | null; page: number | null }
      >(
        `/student/chat/sessions/${activeSessionId}/message`,
        { text, ...(imageToSend ? { imageBase64: imageToSend.base64 } : {}) },
        (delta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, content: (m.content ?? '') + delta } : m)),
          );
        },
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId
            ? { ...m, sources: done.sources, returned_images: done.returnedImages, subject_warning: done.subjectWarning }
            : m,
        ),
      );
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, updated_at: new Date().toISOString() } : s)),
      );
    } catch (err) {
      // A failure before any token ever streamed leaves nothing worth
      // showing in the placeholder bubble — drop it rather than leave an
      // empty assistant turn sitting in the transcript. One that failed
      // mid-stream keeps whatever text the student already saw.
      setMessages((prev) => prev.filter((m) => !(m.id === replyId && !m.content)));
      const message =
        err instanceof ApiClientError && err.code === 'RATE_LIMITED'
          ? "You've reached today's question limit (50/day) — try again tomorrow."
          : err instanceof ApiClientError && err.code === 'AI_RATE_LIMIT'
            ? 'The tutor is helping other students right now — try again in a moment.'
            : err instanceof ApiClientError
              ? err.message
              : 'Failed to send message';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] ${activeSessionId ? 'h-[calc(100vh-160px)] min-h-[560px]' : 'min-h-[460px]'}`}>
      {/* Sidebar: subjects + past sessions */}
      <aside className="no-scrollbar flex max-h-56 flex-col gap-5 overflow-y-auto border-b border-slate-200 bg-slate-50/70 p-4 lg:max-h-none lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><MessageSquareText size={18} /></span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-slate-900">Doubt Tutor</h2>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500">Class {classNum} academic workspace</p>
          </div>
        </div>
        <div>
          <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Start a conversation</span>
          <div className="flex flex-col gap-1.5">
            {subjects === null ? (
              <Loader2 size={14} className={`animate-spin ${a.spinner}`} />
            ) : subjects.length === 0 ? (
              <p className="text-[11px] text-slate-400">No subjects configured for your class yet.</p>
            ) : (
              subjects.map((subject) => (
                <button key={subject} onClick={() => void startSession(subject)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer">
                  {subject} <Plus size={13} className={a.text} />
                </button>
              ))
            )}
          </div>
        </div>

        {sessions.length > 0 && (
          <div>
            <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Recent conversations</span>
            <div className="flex flex-col gap-1">
              {sessions.map((s) => (
                <div key={s.id}
                  className={`group relative flex items-center rounded-lg border transition-all ${
                    activeSessionId === s.id ? `${a.soft} border-current/10` : 'border-transparent hover:border-slate-200 hover:bg-white'
                  }`}>
                  {renamingSessionId === s.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => void commitRename()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void commitRename();
                        if (e.key === 'Escape') setRenamingSessionId(null);
                      }}
                      maxLength={80}
                      className="flex-1 min-w-0 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 mx-2 my-1 outline-none"
                    />
                  ) : (
                    <>
                      <button onClick={() => void openSession(s.id)}
                        className={`flex-1 min-w-0 text-left text-xs px-3 py-2 rounded-xl cursor-pointer ${
                          activeSessionId === s.id ? 'font-bold text-slate-800' : 'text-slate-500'
                        }`}>
                        <span className="block truncate group-hover:pr-12">{sessionLabel(s)}</span>
                        <span className="block text-[9px] text-slate-400 font-normal">
                          {new Date(s.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </button>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                        <button onClick={() => startRename(s)} title="Rename chat"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg cursor-pointer">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => void handleDeleteSession(s.id)} title="Delete chat"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg cursor-pointer">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Chat panel */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {!activeSessionId ? (
          <div className="flex flex-1 items-center justify-center bg-slate-50/30 p-6 sm:p-10">
            <div className="w-full max-w-xl text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"><BookOpen size={21} /></span>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Ask from your textbooks</h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">Choose a subject and ask a question. You can also attach a photo from your Class {classNum} book.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {(subjects ?? []).map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => void startSession(subject)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-400 hover:text-slate-950 cursor-pointer"
                  >
                    {subject}
                  </button>
                ))}
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400"><ShieldCheck size={12} className={a.text} /> Answers include textbook references when available</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="min-w-0">
                <h2 className="truncate font-display text-sm font-bold text-slate-900">{activeSession?.subject ?? 'Subject'} Tutor</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">Answers checked against your Class {classNum} learning material</p>
              </div>
              <span className="hidden items-center gap-1.5 text-[10px] font-semibold text-slate-500 sm:inline-flex"><ShieldCheck size={13} className={a.text} /> Source-grounded tutor</span>
            </header>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
              {messages.length === 0 && (
                <div className="m-auto w-full max-w-2xl py-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"><BookOpen size={21} /></span>
                  <h3 className="mt-4 font-display text-lg font-bold text-slate-900">Ask your {activeSession?.subject ?? 'subject'} question</h3>
                  <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500">Type a question or attach a clear photo from your textbook. The tutor will explain the method and cite the relevant learning material.</p>
                  <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
                    {[
                      'Explain a concept step by step',
                      'Help me solve a textbook question',
                      'Check my answer and show corrections',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[11px] font-semibold leading-4 text-slate-600 shadow-xs transition hover:border-slate-300 hover:text-slate-900 cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400"><ShieldCheck size={12} className={a.text} /> Responses are grounded in your school’s uploaded books</div>
                </div>
              )}
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex max-w-[88%] flex-col gap-1.5 sm:max-w-[78%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="px-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{isUser ? 'You' : 'EduAI Tutor'}</span>
                    {isUser && msg.image_url && (
                      <img src={msg.image_url} alt="Question you shared" loading="lazy"
                        className="max-w-[220px] max-h-56 object-contain rounded-2xl rounded-tr-sm border border-slate-100" />
                    )}
                    {!isUser && msg.subject_warning && (
                      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium leading-relaxed rounded-xl px-3 py-2">
                        <Info size={12} className="shrink-0 mt-0.5" /> {msg.subject_warning}
                      </div>
                    )}
                    {msg.content && (
                      <div className={`rounded-2xl px-4 py-3.5 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? 'rounded-tr-sm bg-slate-900 text-white whitespace-pre-line'
                          : 'rounded-tl-sm border border-slate-200 bg-white text-slate-700'
                      }`}>
                        {isUser ? msg.content : <MarkdownAnswer content={msg.content} />}
                      </div>
                    )}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5 border-t border-slate-200/80 pt-2">
                        {msg.sources.map((src, i) => (
                          <span key={i} title={src.excerpt} className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold ${a.text}`}>
                            <BookOpen size={10} /> {src.bookTitle}{src.chapter ? `, ${src.chapter}` : ''}{src.page ? `, p. ${src.page}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isUser && msg.returned_images && msg.returned_images.filter((img) => !brokenImages.has(img.url)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.returned_images.filter((img) => !brokenImages.has(img.url)).map((img, i) => (
                          <a key={i} href={img.url} target="_blank" rel="noreferrer"
                            className="block w-40 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                            <img src={img.url} alt={img.caption ?? 'Textbook diagram'} loading="lazy"
                              onError={() => setBrokenImages((prev) => new Set(prev).add(img.url))}
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
              {/* Once the reply starts streaming in, the growing text bubble
                  above is itself the "it's working" signal — showing both
                  that and a spinner reads as stuck even while text is
                  actively appearing. */}
              {isSending && !(messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content) && (
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

            <div className="border-t border-slate-200 bg-white">
              {pendingImage && (
                <div className="px-4 pt-3 flex items-center gap-2">
                  <div className="relative">
                    <img src={pendingImage.dataUrl} alt="Question to send" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                    <button type="button" onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center cursor-pointer">
                      <X size={11} />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Photo attached — describe it or just send</span>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2 p-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} className="hidden" />
                <button type="button" title="Attach a photo of your question" onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-50 cursor-pointer">
                  <Camera size={16} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={pendingImage ? 'Add a note (optional)…' : 'Ask a question, or paste/attach a photo of it…'}
                  disabled={isSending}
                  className={`min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 ${a.ring}`}
                />
                <button type="submit" disabled={isSending || (!input.trim() && !pendingImage)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bg} text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer`}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
