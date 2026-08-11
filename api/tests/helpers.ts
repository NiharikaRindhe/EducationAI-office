import 'dotenv/config';

/**
 * Test helpers for the security suite.
 *
 * These talk to the running local stack over HTTP exactly as an attacker
 * would: the API on :4000 and — critically — PostgREST on :54321 directly,
 * bypassing the API entirely. Several of the vulnerabilities these tests
 * cover were only reachable that way, so a suite that only exercised the
 * API would have passed while the platform was wide open.
 */

export const API = process.env.TEST_API_URL ?? 'http://localhost:4000/api';
export const REST = process.env.TEST_SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

export interface Actor {
  token: string;
  id: string;
  role: string;
  schoolId: string | null;
}

/**
 * Log in, backing off through the login rate limiter.
 *
 * The limiter is deliberately aggressive (it defends the PIN/password
 * endpoints) and is now backed by a SHARED, PERSISTENT counter — it no longer
 * resets when the API restarts. A suite that signs in ten actors from one IP
 * therefore trips it routinely on a developer machine, and a local run can
 * take half a minute waiting out a window. That is the limiter working.
 *
 * Retrying on 429 keeps the suite usable without weakening the limit that
 * protects production. In CI the database starts empty, so no counter is
 * carried over and the suite runs at full speed.
 */
export async function login(email: string, password: string): Promise<Actor> {
  let res!: Response;

  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 15_000));
  }

  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status} ${await res.text()}`);
  const { accessToken } = (await res.json()) as { accessToken: string };

  const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const me = (await meRes.json()) as { id: string; role: string; school_id: string | null };
  return { token: accessToken, id: me.id, role: me.role, schoolId: me.school_id };
}

/** Call the API as a given actor. */
export function api(actor: Actor, path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${actor.token}`,
      ...(init.headers ?? {}),
    },
  });
}

/**
 * Call PostgREST DIRECTLY with the actor's own token — the attack path.
 * Anything reachable here is reachable by any user with a browser console,
 * with none of the API's validation in front of it.
 */
export function rest(actor: Actor, path: string, init: RequestInit = {}) {
  return fetch(`${REST}/rest/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${actor.token}`,
      ...(init.headers ?? {}),
    },
  });
}

/** True when PostgREST refused the write — either RLS or a missing grant. */
export async function isDenied(res: Response): Promise<boolean> {
  if (res.status === 401 || res.status === 403) return true;
  const text = await res.text();
  // A revoked table grant surfaces as 42501; an RLS violation as 42501 too,
  // with a different message. An UPDATE filtered out by RLS returns 200 with
  // an empty array — nothing was modified, which is also a denial.
  if (/permission denied|violates row-level security/i.test(text)) return true;
  if (res.ok && text.trim() === '[]') return true;
  return false;
}
