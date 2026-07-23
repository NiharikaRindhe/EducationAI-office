import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceKey: required('SUPABASE_SERVICE_KEY'),
  // Must match the local Supabase stack's GOTRUE_JWT_SECRET (see `supabase status`)
  // so hand-minted PIN-login tokens verify identically to GoTrue-issued ones.
  supabaseJwtSecret: required('SUPABASE_JWT_SECRET'),

  // ── Chat-completion provider ──────────────────────────────
  // With CLOUD_AI_API_KEY set, chat/grading/vision calls go to this
  // OpenAI-compatible endpoint (OpenRouter, Gemini, DeepSeek, Groq — or
  // later the org's own vLLM server, which speaks the same protocol).
  // Without it, everything runs on the local Ollama daemon as before.
  cloudAiBaseUrl: process.env.CLOUD_AI_BASE_URL ?? '',
  cloudAiApiKey: process.env.CLOUD_AI_API_KEY ?? '',
  // CLOUD_AI_API_KEY may be a comma-separated list — some free-tier providers
  // (Ollama Cloud included) rate-limit per key/account, not per app, so
  // several free keys round-robinned go further than one. lib/ai.ts rotates
  // to the next key on a 429/quota response instead of failing the request.
  get cloudAiApiKeys(): string[] {
    return this.cloudAiApiKey
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  },

  // Per-task model tiers (see lib/ai.ts): the tutor optimizes for speed and
  // volume; grading/question-gen are rare, async, and accuracy-critical;
  // vision needs a multimodal model. Unset tiers fall back to AI_CHAT_MODEL.
  aiChatModel: process.env.AI_CHAT_MODEL ?? process.env.OLLAMA_CHAT_MODEL ?? 'gpt-oss:20b-cloud',
  get aiGradingModel() {
    return process.env.AI_GRADING_MODEL ?? this.aiChatModel;
  },
  get aiQgenModel() {
    return process.env.AI_QGEN_MODEL ?? this.aiGradingModel;
  },
  get aiVisionModel() {
    return process.env.AI_VISION_MODEL ?? this.aiChatModel;
  },

  // ── Ollama (embeddings always; chat fallback when no cloud key) ──
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'mxbai-embed-large',

  // ── Transactional email (credential mails etc.) ───────────
  // Unset SMTP_HOST disables sending entirely — credentials are still
  // shown once in the UI, so email is an enhancement, never a dependency.
  // Local dev: Supabase's Mailpit accepts SMTP on 54325 (UI at :54324).
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM ?? 'EduAI <no-reply@eduai.local>',
  // Public URL of the frontend, used for links inside emails.
  appUrl: process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:5173',
};
