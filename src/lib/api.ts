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
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.skipAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = payload?.error;
    throw new ApiClientError(err?.code ?? 'UNKNOWN', err?.message ?? res.statusText, res.status, err?.details);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** For endpoints returning a binary blob (admit card PDF/zip) rather than JSON. */
  async download(path: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(buildUrl(path), { headers });
    if (!res.ok) throw new ApiClientError('DOWNLOAD_FAILED', res.statusText, res.status);
    return res.blob();
  },
  async upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(buildUrl(path), { method: 'POST', headers, body: formData });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = payload?.error;
      throw new ApiClientError(err?.code ?? 'UNKNOWN', err?.message ?? res.statusText, res.status, err?.details);
    }
    return payload as T;
  },
};
