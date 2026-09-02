const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = localStorage.getItem('eduai_access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('eduai_access_token', token);
  else localStorage.removeItem('eduai_access_token');
}

export function getAccessToken() {
  return accessToken;
}

// AuthContext only checks the token once, on app load — a token that dies
// mid-session (expiry, or the local Supabase instance restarting with a
// fresh auth store) used to surface as a raw "Invalid or expired token"
// error on whatever request hit it next, leaving the page stuck instead of
// returning the student to login. Any authenticated request that gets a 401
// now clears the dead token and notifies whoever's listening (AuthContext),
// so the existing !user -> redirect-to-login route guard just handles it.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

function handleSessionExpired() {
  sessionStorage.setItem('eduai_login_reason', 'token-expired');
  setAccessToken(null);
  onUnauthorized?.();
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip attaching the Authorization header (login/pin-roster/pin-login are called before a token exists). */
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const wasAuthenticated = !options.skipAuth && Boolean(accessToken);
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (wasAuthenticated) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // Only a 401 on a request that WAS carrying a token means "your session
    // died" — skipAuth calls (login itself) return 401 for wrong credentials,
    // which is a normal login-form error, not a reason to log anyone out.
    if (res.status === 401 && wasAuthenticated) handleSessionExpired();
    const err = payload?.error;
    throw new ApiClientError(err?.code ?? 'UNKNOWN', err?.message ?? res.statusText, res.status, err?.details);
  }

  return payload as T;
}

/** Non-text fields carried on a chat stream's closing frame — everything
 *  the plain (non-streamed) response used to return alongside `answer`.
 *  Generic over the source/image shapes so callers get real typing instead
 *  of `unknown[]`. */
export interface ChatStreamDone<TSource = unknown, TImage = unknown> {
  sources: TSource[];
  returnedImages: TImage[];
  imageUrl: string | null;
  subjectWarning: string | null;
}

/** Streaming counterpart to `api.post`, for the one endpoint (AI Doubt
 *  Tutor chat) that responds with `text/event-stream` instead of JSON — a
 *  streamed body can't be read with `res.json()`, so this can't go through
 *  the shared `request()` helper above. Calls `onDelta` with each
 *  incremental chunk of the reply as it arrives, then resolves with the
 *  closing frame's non-text fields once the stream ends. */
async function postStream<TSource = unknown, TImage = unknown>(
  path: string,
  body: unknown,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<ChatStreamDone<TSource, TImage>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path), { method: 'POST', headers, body: JSON.stringify(body), signal });

  if (!res.ok) {
    if (res.status === 401 && accessToken) handleSessionExpired();
    const payload = await res.json().catch(() => null);
    const err = payload?.error;
    throw new ApiClientError(err?.code ?? 'UNKNOWN', err?.message ?? res.statusText, res.status, err?.details);
  }
  if (!res.body) throw new ApiClientError('NETWORK', 'The chat stream came back empty', 0);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneFrame: ChatStreamDone<TSource, TImage> | null = null;
  let streamError: string | null = null;

  const applyFrame = (payload: string) => {
    let event: { type: string; text?: string; error?: string } & Partial<ChatStreamDone<TSource, TImage>>;
    try {
      event = JSON.parse(payload);
    } catch {
      return; // a stray/partial frame — skip rather than crash the stream
    }
    if (event.type === 'delta' && event.text) {
      onDelta(event.text);
    } else if (event.type === 'done') {
      doneFrame = {
        sources: event.sources ?? [],
        returnedImages: event.returnedImages ?? [],
        imageUrl: event.imageUrl ?? null,
        subjectWarning: event.subjectWarning ?? null,
      };
    } else if (event.type === 'error') {
      streamError = event.error ?? 'Failed to generate a reply';
    }
  };

  const consume = () => {
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const block of parts) {
      const payload = block
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.replace(/^data:\s?/, ''))
        .join('\n')
        .trim();
      if (payload) applyFrame(payload);
    }
  };

  while (true) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    consume();
  }
  buffer += decoder.decode();
  consume();

  if (streamError) throw new ApiClientError('AI_ERROR', streamError, 0);
  if (!doneFrame) throw new ApiClientError('NETWORK', 'The chat stream ended unexpectedly', 0);
  return doneFrame;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  postStream,
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** For endpoints returning a binary blob (CSV export, etc.) rather than
   *  JSON. Takes a query so an export can carry the same filters the
   *  on-screen table is using. */
  async download(path: string, query?: RequestOptions['query']): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(buildUrl(path, query), { headers });
    if (res.status === 401 && accessToken) handleSessionExpired();
    if (!res.ok) throw new ApiClientError('DOWNLOAD_FAILED', res.statusText, res.status);
    return res.blob();
  },
  /** Multipart upload. Goes through XMLHttpRequest rather than fetch because
   *  fetch cannot report upload progress — and a 150MB textbook uploading
   *  behind nothing but a spinner is indistinguishable from a hung page. */
  upload<T>(
    path: string,
    file: File,
    fields?: Record<string, string>,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (fields) {
      for (const [key, value] of Object.entries(fields)) formData.append(key, value);
    }

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', buildUrl(path));
      if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        });
      }

      xhr.addEventListener('load', () => {
        const payload = (() => {
          try { return JSON.parse(xhr.responseText); } catch { return null; }
        })();
        if (xhr.status === 401 && accessToken) handleSessionExpired();
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as T);
          return;
        }
        const err = payload?.error;
        reject(new ApiClientError(err?.code ?? 'UNKNOWN', err?.message ?? xhr.statusText, xhr.status, err?.details));
      });
      xhr.addEventListener('error', () => reject(new ApiClientError('NETWORK', 'Upload failed — check your connection', 0)));
      xhr.addEventListener('abort', () => reject(new ApiClientError('ABORTED', 'Upload cancelled', 0)));

      xhr.send(formData);
    });
  },
};
