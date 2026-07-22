import { env } from './env.js';
import { logger } from './logger.js';
import { getPlatformSetting, modelSettingKey, featureSettingKey } from './platformSettings.js';
import { logAiUsage, type AiUsageContext } from './aiUsage.js';

// ─────────────────────────────────────────────────────────────
//  AI CLIENT — provider-routed.
//
//  Chat completions go to an OpenAI-compatible cloud API when
//  CLOUD_AI_API_KEY is set (OpenRouter, Gemini, DeepSeek, Groq —
//  and later the school's own vLLM server, which speaks the same
//  protocol; "move to local LLM" is a .env change, not a code
//  change). Without a cloud key they fall back to the local
//  Ollama daemon, preserving the original fully-local mode.
//
//  Embeddings ALWAYS run on local Ollama (mxbai-embed-large,
//  CPU): they fire on every chat message and every ingested
//  chunk, and the 1024-dim vector space already stored in
//  text_chunks/book_images is tied to that model — a cloud
//  embedding API would add per-call cost forever and strand the
//  existing vectors.
//
//  Model choice per tier and the AI-tier kill-switches are both
//  runtime-editable by the Super Admin (platform_settings table,
//  see lib/platformSettings.ts) and fall back to the env vars
//  below when no override is set.
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** Base64-encoded images (no data: prefix) for vision-tier calls. */
  images?: string[];
}

/** Different jobs need different models: the tutor needs speed and volume,
 *  grading needs accuracy on rare async calls. Each tier maps to an env var
 *  and falls back to the chat model when unset. */
export type ModelTier = 'chat' | 'grading' | 'qgen' | 'vision';

function envModelForTier(tier: ModelTier): string {
  switch (tier) {
    case 'grading':
      return env.aiGradingModel;
    case 'qgen':
      return env.aiQgenModel;
    case 'vision':
      return env.aiVisionModel;
    default:
      return env.aiChatModel;
  }
}

async function modelForTier(tier: ModelTier): Promise<string> {
  const override = await getPlatformSetting<string>(modelSettingKey(tier));
  return override && override.trim() ? override : envModelForTier(tier);
}

/** Super Admin kill-switch per tier. Unset = enabled (fresh install behaves as before). */
export async function isTierEnabled(tier: ModelTier): Promise<boolean> {
  const enabled = await getPlatformSetting<boolean>(featureSettingKey(tier));
  return enabled !== false;
}

function cloudConfigured(): boolean {
  return Boolean(env.cloudAiApiKey && env.cloudAiBaseUrl);
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

/** Is this AI tier usable right now — enabled by the Super Admin AND some
 *  provider reachable? Callers use this to degrade gracefully (pending
 *  manual grading, "tutor offline" message) — never 500. */
export async function aiConfigured(tier: ModelTier = 'chat'): Promise<boolean> {
  if (!(await isTierEnabled(tier))) return false;
  if (cloudConfigured()) return true;
  return isDaemonReachable();
}

interface ChatOpts {
  jsonMode?: boolean;
  tier?: ModelTier;
  /** School/user attribution for the AI Console's usage-by-school breakdown. Omit for system-initiated calls. */
  usageContext?: AiUsageContext;
}

// OpenAI-compatible /chat/completions. Vision messages become multimodal
// content parts (data URIs), which is how every OpenAI-compatible provider
// (and vLLM) accepts images.
async function cloudChatCompletion(messages: ChatMessage[], opts: ChatOpts): Promise<string> {
  const tier = opts.tier ?? 'chat';
  const model = await modelForTier(tier);
  const body = {
    model,
    messages: messages.map((m) =>
      m.images?.length
        ? {
            role: m.role,
            content: [
              { type: 'text', text: m.content },
              ...m.images.map((b64) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${b64}` },
              })),
            ],
          }
        : { role: m.role, content: m.content },
    ),
    ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const response = await fetch(`${env.cloudAiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.cloudAiApiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    logger.error({ status: response.status, body: text }, 'Cloud AI chat request failed');
    throw new Error(`Cloud AI chat request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Cloud AI returned no content');

  if (opts.usageContext) {
    logAiUsage(opts.usageContext, tier, 'cloud', model, data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0);
  }

  return content;
}

async function ollamaChatCompletion(messages: ChatMessage[], opts: ChatOpts): Promise<string> {
  if (!(await isDaemonReachable())) {
    throw new Error('Ollama daemon is not reachable — AI features are unavailable until it is running');
  }

  const tier = opts.tier ?? 'chat';
  const model = await modelForTier(tier);

  const response = await fetch(`${env.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages, // Ollama natively accepts { role, content, images?: base64[] }
      stream: false,
      ...(opts.jsonMode ? { format: 'json' } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error({ status: response.status, body }, 'Ollama chat request failed');
    throw new Error(`Ollama chat request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    message?: { content?: string };
    prompt_eval_count?: number;
    eval_count?: number;
  };
  const content = data.message?.content;
  if (!content) throw new Error('Ollama returned no content');

  if (opts.usageContext) {
    logAiUsage(opts.usageContext, tier, 'ollama', model, data.prompt_eval_count ?? 0, data.eval_count ?? 0);
  }

  return content;
}

export async function chatCompletion(messages: ChatMessage[], opts: ChatOpts = {}): Promise<string> {
  const tier = opts.tier ?? 'chat';
  if (!(await isTierEnabled(tier))) {
    throw new Error(`The "${tier}" AI feature has been disabled by your platform administrator`);
  }

  if (cloudConfigured()) {
    try {
      return await cloudChatCompletion(messages, opts);
    } catch (err) {
      // Cloud down/rate-limited mid-lab-period: a reachable local daemon can
      // still answer rather than the whole feature going dark.
      if (await isDaemonReachable()) {
        logger.warn({ err }, 'Cloud AI failed — falling back to local Ollama');
        return ollamaChatCompletion(messages, opts);
      }
      throw err;
    }
  }
  return ollamaChatCompletion(messages, opts);
}

/** Embeddings always run locally (mxbai-embed-large, CPU) — see header comment. */
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${env.ollamaUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.ollamaEmbedModel, prompt: text }),
  });

  if (!response.ok) {
    // Ollama's real reason (e.g. "the input length exceeds the context
    // length") only ever shows up in the response body, not the status code —
    // this bit us in production: every "Ollama embedding request failed: 500"
    // log line looked identical whether the cause was a transient hiccup or a
    // chunk that will NEVER embed no matter how many times you retry it.
    const body = await response.text().catch(() => '');
    throw new Error(`Ollama embedding request failed: ${response.status}${body ? ` — ${body}` : ''}`);
  }

  const data = (await response.json()) as { embedding?: number[] };
  if (!data.embedding) throw new Error('Ollama returned no embedding');
  return data.embedding;
}

/** Non-throwing variant for bulk ingestion: a chunk without an embedding is
 *  still worth inserting (RAG search just never surfaces it until re-embedded).
 *  mxbai-embed-large has a hard 512-token context window; pdfExtract.ts
 *  targets chunks well under that, but real text can still tokenize denser
 *  than the word-count estimate for some chunks — if THAT'S the failure,
 *  retrying the same text is pointless (it fails identically every time), so
 *  fall back to embedding a truncated prefix instead of losing the chunk
 *  from retrieval entirely. Any other error gets one plain retry. */
export async function tryEmbedText(text: string): Promise<number[] | null> {
  try {
    return await embedText(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('context length')) {
      try {
        return await embedText(text.slice(0, Math.floor(text.length * 0.7)));
      } catch (truncatedErr) {
        logger.warn(
          { err: truncatedErr, textPreview: text.slice(0, 80) },
          '[embed] chunk exceeds embedding context length even truncated — inserted without a vector',
        );
        return null;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      return await embedText(text);
    } catch (retryErr) {
      logger.warn({ err: retryErr, textPreview: text.slice(0, 80) }, '[embed] embedding failed for one chunk after retry — inserted without a vector');
      return null;
    }
  }
}
