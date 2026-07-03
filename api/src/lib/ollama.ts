import { env } from './env.js';
import { logger } from './logger.js';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

let daemonReachable: boolean | null = null;

/** Cached after the first check — a school lab isn't restarting its Ollama daemon mid-period. */
async function isDaemonReachable(): Promise<boolean> {
  if (daemonReachable !== null) return daemonReachable;
  try {
    const res = await fetch(`${env.ollamaUrl}/api/version`, { signal: AbortSignal.timeout(2000) });
    daemonReachable = res.ok;
  } catch {
    daemonReachable = false;
  }
  return daemonReachable;
}

export async function ollamaConfigured(): Promise<boolean> {
  return isDaemonReachable();
}

/**
 * Chat completion — model name decides local vs cloud. A `-cloud` suffixed
 * model (e.g. gpt-oss:20b-cloud) is proxied by the local daemon to Ollama
 * Cloud using the daemon's own authenticated session; a plain model name
 * runs fully on-box. Either way this call looks identical from here.
 */
export async function chatCompletion(messages: ChatMessage[], opts: { jsonMode?: boolean } = {}): Promise<string> {
  if (!(await isDaemonReachable())) {
    throw new Error('Ollama daemon is not reachable — AI features are unavailable until it is running');
  }

  const response = await fetch(`${env.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.ollamaChatModel,
      messages,
      stream: false,
      ...(opts.jsonMode ? { format: 'json' } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error({ status: response.status, body }, 'Ollama chat request failed');
    throw new Error(`Ollama chat request failed: ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content;
  if (!content) throw new Error('Ollama returned no content');
  return content;
}

/** Embeddings always run locally (mxbai-embed-large, CPU) — needed on every retrieval, so it must not depend on cloud reachability or incur per-call cost. */
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${env.ollamaUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.ollamaEmbedModel, prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed: ${response.status}`);
  }

  const data = (await response.json()) as { embedding?: number[] };
  if (!data.embedding) throw new Error('Ollama returned no embedding');
  return data.embedding;
}
