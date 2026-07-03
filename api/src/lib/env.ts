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

  // One local Ollama daemon handles both local and cloud-hosted models —
  // the model name decides the routing (a `-cloud` suffix means the daemon
  // proxies to Ollama Cloud using its own auth, set once via `ollama signin`
  // or the daemon's OLLAMA_API_KEY env var; nothing per-request from here).
  // No separate cloud API key/URL needed at the application layer.
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
  ollamaChatModel: process.env.OLLAMA_CHAT_MODEL ?? 'gpt-oss:20b-cloud',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'mxbai-embed-large',
};
