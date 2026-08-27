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
  return Boolean(env.cloudAiApiKeys.length && env.cloudAiBaseUrl);
}

// Sticky rotation, not round-robin-per-request: stay on a key until IT hits a
// limit, then move on and stay there. Module-level because Node keeps one
// instance of this module per process — the same daemon serves every
// request, so "the account we're currently spending down" is process state,
// not per-request state.
let currentKeyIndex = 0;

function isRateLimitOrQuotaError(status: number, body: string): boolean {
  if (status === 429 || status === 402) return true;
  // Some providers (Ollama Cloud's subscription gate included) return 400/403
  // for "out of quota" / "needs upgrade" rather than a clean 429 — those are
  // exactly the case another key might still have room for, so text-sniff
  // the body rather than only trusting the status code.
  return /rate.?limit|quota|requires a subscription|too many requests/i.test(body);
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

export interface ChatOpts {
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

  const keys = env.cloudAiApiKeys;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const response = await fetch(`${env.cloudAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys[keyIndex]}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (isRateLimitOrQuotaError(response.status, text) && attempt < keys.length - 1) {
        logger.warn(
          { status: response.status, keyIndex, keysAvailable: keys.length },
          'Cloud AI key hit its limit — rotating to the next key',
        );
        currentKeyIndex = (keyIndex + 1) % keys.length;
        continue;
      }
      logger.error({ status: response.status, body: text }, 'Cloud AI chat request failed');
      lastError = new Error(`Cloud AI chat request failed: ${response.status}`);
      break;
    }

    currentKeyIndex = keyIndex; // this key worked — stay on it next call
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

  throw lastError ?? new Error('All cloud AI keys are rate-limited or over quota');
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

// ─────────────────────────────────────────────────────────────
//  STREAMING — additive only. chatCompletion() above and its callers
//  are untouched; this is a separate entry point for the one caller
//  (the PDF Simulator's chat tutor) that needs real token-by-token
//  delivery instead of a single blocking response.
//
//  Rotation/fallback rule: a provider or key may be swapped for
//  another BEFORE any chunk has reached the caller's onChunk (same
//  retryable-miss handling as chatCompletion()'s non-streaming path).
//  Once even one chunk has been delivered, a later failure throws
//  StreamInterruptedError instead of silently retrying elsewhere —
//  the caller has already shown the student real text, so restarting
//  on a different provider would duplicate or contradict it.
// ─────────────────────────────────────────────────────────────

export type StreamChunkHandler = (textDelta: string) => void;

/** Thrown when a stream fails after at least one chunk was already
 *  forwarded to the caller. Callers can read `partialText` to decide
 *  what to do with whatever the student already saw. */
export class StreamInterruptedError extends Error {
  constructor(message: string, public readonly partialText: string) {
    super(message);
    this.name = 'StreamInterruptedError';
  }
}

async function cloudChatCompletionStream(messages: ChatMessage[], opts: ChatOpts, onChunk: StreamChunkHandler, signal?: AbortSignal): Promise<void> {
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
    stream: true,
    // OpenAI-compatible extension: asks the final chunk to carry token
    // counts. Providers that don't support it just omit usage — falls
    // back to the same `?? 0` pattern chatCompletion() already uses.
    stream_options: { include_usage: true },
    ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const keys = env.cloudAiApiKeys;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const response = await fetch(`${env.cloudAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys[keyIndex]}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (isRateLimitOrQuotaError(response.status, text) && attempt < keys.length - 1) {
        logger.warn(
          { status: response.status, keyIndex, keysAvailable: keys.length },
          'Cloud AI key hit its limit — rotating to the next key (streaming)',
        );
        currentKeyIndex = (keyIndex + 1) % keys.length;
        continue;
      }
      logger.error({ status: response.status, body: text }, 'Cloud AI streaming chat request failed');
      lastError = new Error(`Cloud AI chat request failed: ${response.status}`);
      break;
    }

    if (!response.body) {
      lastError = new Error('Cloud AI returned no response body for a streaming request');
      if (attempt < keys.length - 1) continue;
      break;
    }

    let deliveredAny = false;
    let accumulated = '';
    let usage: { promptTokens: number; completionTokens: number } | undefined;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // A caller-supplied signal only cancels the READER once the connection
    // is already open (the initial request above keeps its own timeout
    // signal) — enough to stop spending on a student who closed the tab
    // mid-answer without needing to combine two AbortSignals.
    const onExternalAbort = () => { reader.cancel().catch(() => {}); };
    signal?.addEventListener('abort', onExternalAbort);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          for (const line of frame.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let json: { choices?: { delta?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
            try {
              json = JSON.parse(payload);
            } catch {
              continue; // a stray/partial frame — skip rather than abort the stream over it
            }
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              deliveredAny = true;
              accumulated += delta;
              onChunk(delta);
            }
            if (json.usage) {
              usage = { promptTokens: json.usage.prompt_tokens ?? 0, completionTokens: json.usage.completion_tokens ?? 0 };
            }
          }
        }
      }
    } catch (err) {
      if (deliveredAny) throw new StreamInterruptedError(err instanceof Error ? err.message : String(err), accumulated);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < keys.length - 1) continue;
      break;
    } finally {
      signal?.removeEventListener('abort', onExternalAbort);
    }

    if (!deliveredAny) {
      lastError = new Error('Cloud AI streaming response produced no content');
      if (attempt < keys.length - 1) continue;
      break;
    }

    currentKeyIndex = keyIndex; // this key worked — stay on it next call
    if (opts.usageContext) {
      logAiUsage(opts.usageContext, tier, 'cloud', model, usage?.promptTokens ?? 0, usage?.completionTokens ?? 0);
    }
    return;
  }

  throw lastError ?? new Error('All cloud AI keys are rate-limited or over quota');
}

async function ollamaChatCompletionStream(messages: ChatMessage[], opts: ChatOpts, onChunk: StreamChunkHandler, signal?: AbortSignal): Promise<void> {
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
      messages,
      stream: true,
      ...(opts.jsonMode ? { format: 'json' } : {}),
    }),
    signal, // no competing timeout signal on this path, so this can attach directly
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error({ status: response.status, body }, 'Ollama streaming chat request failed');
    throw new Error(`Ollama chat request failed: ${response.status}`);
  }
  if (!response.body) throw new Error('Ollama returned no response body for a streaming request');

  let deliveredAny = false;
  let accumulated = '';
  let promptEvalCount = 0;
  let evalCount = 0;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Ollama's streaming wire format is newline-delimited JSON, not SSE.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let json: { message?: { content?: string }; done?: boolean; prompt_eval_count?: number; eval_count?: number };
        try {
          json = JSON.parse(trimmed);
        } catch {
          continue;
        }
        const content = json.message?.content;
        if (content) {
          deliveredAny = true;
          accumulated += content;
          onChunk(content);
        }
        if (json.done) {
          promptEvalCount = json.prompt_eval_count ?? 0;
          evalCount = json.eval_count ?? 0;
        }
      }
    }
  } catch (err) {
    if (deliveredAny) throw new StreamInterruptedError(err instanceof Error ? err.message : String(err), accumulated);
    throw err;
  }

  if (!deliveredAny) throw new Error('Ollama streaming response produced no content');

  if (opts.usageContext) {
    logAiUsage(opts.usageContext, tier, 'ollama', model, promptEvalCount, evalCount);
  }
}

/** Streaming counterpart to chatCompletion() — same tier gating, same
 *  cloud-vs-Ollama dispatch, same graceful cloud->Ollama degradation,
 *  but delivers text incrementally via onChunk instead of returning
 *  the full string at once. See the section header comment above for
 *  the rotation/interruption contract. `signal`, if given, cancels the
 *  in-flight request once the connection is open (e.g. the caller's
 *  HTTP response closed) — it does not need to be combined with the
 *  per-request timeout signal each provider path already sets. */
export async function chatCompletionStream(messages: ChatMessage[], opts: ChatOpts = {}, onChunk: StreamChunkHandler, signal?: AbortSignal): Promise<void> {
  const tier = opts.tier ?? 'chat';
  if (!(await isTierEnabled(tier))) {
    throw new Error(`The "${tier}" AI feature has been disabled by your platform administrator`);
  }

  if (cloudConfigured()) {
    try {
      await cloudChatCompletionStream(messages, opts, onChunk, signal);
      return;
    } catch (err) {
      if (err instanceof StreamInterruptedError) throw err; // already shown the student something — don't retry elsewhere
      if (await isDaemonReachable()) {
        logger.warn({ err }, 'Cloud AI streaming failed — falling back to local Ollama');
        return ollamaChatCompletionStream(messages, opts, onChunk, signal);
      }
      throw err;
    }
  }
  return ollamaChatCompletionStream(messages, opts, onChunk, signal);
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
