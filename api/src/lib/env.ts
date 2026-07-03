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

  ollamaCloudUrl: process.env.OLLAMA_CLOUD_URL ?? 'https://ollama.com/api',
  ollamaCloudApiKey: process.env.OLLAMA_CLOUD_API_KEY ?? '',
  ollamaChatModel: process.env.OLLAMA_CHAT_MODEL ?? 'qwen3:latest',

  ollamaLocalUrl: process.env.OLLAMA_LOCAL_URL ?? 'http://127.0.0.1:11434',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
};
