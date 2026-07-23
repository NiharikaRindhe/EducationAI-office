import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Loader2, AlertCircle, Plus, BookOpen, Image as ImageIcon, Camera, X, Pencil, Trash2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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
    try {
      const result = await api.post<{
        answer: string;
        sources: { bookTitle: string; chapter: string | null; page: number | null; excerpt: string }[];
        returnedImages: { url: string; caption: string | null; chapter: string | null; page: number | null }[];
        subjectWarning: string | null;
      }>(`/student/chat/sessions/${activeSessionId}/message`, {
        text,
        ...(imageToSend ? { imageBase64: imageToSend.base64 } : {}),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `local-ai-${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          returned_images: result.returnedImages,
          subject_warning: result.subjectWarning,
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
                <div key={s.id}
                  className={`group relative flex items-center rounded-xl transition-all ${
                    activeSessionId === s.id ? `${a.soft}` : 'hover:bg-slate-50'
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
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? `${a.bubble} text-white rounded-tr-sm whitespace-pre-line`
                          : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'
                      }`}>
                        {isUser ? msg.content : <MarkdownAnswer content={msg.content} />}
                      </div>
                    )}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, i) => (
                          <span key={i} title={src.excerpt} className={`text-[9px] font-bold px-2 py-1 rounded-lg ${a.soft} ${a.text}`}>
                            📖 {src.bookTitle}{src.chapter ? `, ${src.chapter}` : ''}{src.page ? `, Pg${src.page}` : ''}
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

            <div className="bg-slate-50 border-t border-slate-100">
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
              <form onSubmit={handleSend} className="p-4 flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} className="hidden" />
                <button type="button" title="Attach a photo of your question" onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="w-11 h-11 shrink-0 bg-white border border-slate-200 disabled:opacity-50 text-slate-500 rounded-xl flex items-center justify-center transition-all hover:border-slate-300 cursor-pointer">
                  <Camera size={16} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={pendingImage ? 'Add a note (optional)…' : 'Ask a question, or paste/attach a photo of it…'}
                  disabled={isSending}
                  className={`flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none transition-all ${a.ring}`}
                />
                <button type="submit" disabled={isSending || (!input.trim() && !pendingImage)}
                  className={`w-11 h-11 shrink-0 ${a.bg} disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer`}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
