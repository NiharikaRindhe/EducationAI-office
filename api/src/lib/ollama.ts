import { env } from './env.js';
import { logger } from './logger.js';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export const ollamaCloudConfigured = Boolean(env.ollamaCloudApiKey);

/**
 * Ollama Cloud exposes an OpenAI-compatible chat endpoint, so the request
 * shape here is deliberately generic — swapping to a different hosted
 * provider later (or a self-hosted Ollama instance for a school that opts
 * into local inference) is a base-URL/key change, not a rewrite.
 */
export async function chatCompletion(messages: ChatMessage[], opts: { jsonMode?: boolean } = {}): Promise<string> {
  if (!ollamaCloudConfigured) {
    throw new Error('OLLAMA_CLOUD_API_KEY is not set — AI features are unavailable until it is configured');
  }

  const response = await fetch(`${env.ollamaCloudUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ollamaCloudApiKey}`,
    },
    body: JSON.stringify({
      model: env.ollamaChatModel,
      messages,
      stream: false,
      ...(opts.jsonMode ? { format: 'json' } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error({ status: response.status, body }, 'Ollama Cloud request failed');
    throw new Error(`Ollama Cloud request failed: ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content;
  if (!content) throw new Error('Ollama Cloud returned no content');
  return content;
}

/** Local Ollama instance, embeddings only (nomic-embed-text, CPU, no GPU needed). */
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${env.ollamaLocalUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.ollamaEmbedModel, prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Local Ollama embedding request failed: ${response.status}`);
  }

  const data = (await response.json()) as { embedding?: number[] };
  if (!data.embedding) throw new Error('Local Ollama returned no embedding');
  return data.embedding;
}
