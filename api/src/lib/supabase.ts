import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Service-role client — full DB access, bypasses RLS. Server-side use only, never expose to frontend. */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Anon-key client — used for password-grant login itself (auth.signInWithPassword). */
export const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Anon-key client factory — used to validate a caller's JWT and run queries under their RLS identity. */
export function supabaseForToken(accessToken: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
