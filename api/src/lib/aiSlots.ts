import { randomUUID } from 'node:crypto';
import { env } from './env.js';
import { ApiError } from './errors.js';
import { getRedis } from './redis.js';

export type AiSlotKind = 'chat' | 'vision';

interface SlotLimits {
  global: number;
  school: number;
  student: number;
}

interface Lease {
  id: string;
  keys: string[];
  via: 'redis' | 'local';
}

const ACQUIRE_LUA = `
local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local id = ARGV[3]
for i, key in ipairs(KEYS) do
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now)
  if redis.call('ZCARD', key) >= tonumber(ARGV[3 + i]) then
    return 0
  end
end
local exp = now + ttl
for _, key in ipairs(KEYS) do
  redis.call('ZADD', key, exp, id)
end
return 1
`;

const RELEASE_LUA = `
for _, key in ipairs(KEYS) do
  redis.call('ZREM', key, ARGV[1])
end
return 1
`;

/** Per-process fallback while Redis is down — still caps one API, not the fleet. */
const localHeld = new Map<string, { id: string; exp: number }[]>();

function limitsFor(kind: AiSlotKind): SlotLimits {
  if (kind === 'vision') {
    return {
      global: Math.max(1, env.aiVisionMaxGlobal),
      school: Math.max(1, env.aiVisionMaxPerSchool),
      student: Math.max(1, env.aiVisionMaxPerStudent),
    };
  }
  return {
    global: Math.max(1, env.aiChatMaxGlobal),
    school: Math.max(1, env.aiChatMaxPerSchool),
    student: Math.max(1, env.aiChatMaxPerStudent),
  };
}

function slotKeys(kind: AiSlotKind, userId: string, schoolId: string | null): string[] {
  const school = schoolId && schoolId.trim() ? schoolId : 'platform';
  return [`ai:inflight:${kind}:global`, `ai:inflight:${kind}:school:${school}`, `ai:inflight:${kind}:user:${userId}`];
}

function pruneLocal(key: string, now: number): { id: string; exp: number }[] {
  const next = (localHeld.get(key) ?? []).filter((row) => row.exp > now);
  localHeld.set(key, next);
  return next;
}

function acquireLocal(keys: string[], maxes: number[], ttlMs: number, id: string): boolean {
  const now = Date.now();
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const max = maxes[i];
    if (!key || max === undefined) return false;
    if (pruneLocal(key, now).length >= max) return false;
  }
  for (const key of keys) {
    pruneLocal(key, now).push({ id, exp: now + ttlMs });
  }
  return true;
}

function releaseLocal(keys: string[], id: string): void {
  for (const key of keys) {
    localHeld.set(
      key,
      (localHeld.get(key) ?? []).filter((row) => row.id !== id),
    );
  }
}

async function acquireSlot(kind: AiSlotKind, userId: string, schoolId: string | null): Promise<Lease | null> {
  const limits = limitsFor(kind);
  const keys = slotKeys(kind, userId, schoolId);
  const maxes = [limits.global, limits.school, limits.student];
  const ttlMs = Math.max(30, env.aiSlotTtlSec) * 1000;
  const id = randomUUID();

  const redis = await getRedis();
  if (redis?.isOpen) {
    try {
      const allowed = await redis.eval(ACQUIRE_LUA, {
        keys,
        arguments: [String(Date.now()), String(ttlMs), id, ...maxes.map(String)],
      });
      if (allowed === 1 || allowed === '1') return { id, keys, via: 'redis' };
      return null;
    } catch {
      /* fall through to local */
    }
  }

  return acquireLocal(keys, maxes, ttlMs, id) ? { id, keys, via: 'local' } : null;
}

async function releaseSlot(lease: Lease): Promise<void> {
  if (lease.via === 'local') {
    releaseLocal(lease.keys, lease.id);
    return;
  }
  const redis = await getRedis();
  if (!redis?.isOpen) {
    releaseLocal(lease.keys, lease.id);
    return;
  }
  try {
    await redis.eval(RELEASE_LUA, { keys: lease.keys, arguments: [lease.id] });
  } catch {
    releaseLocal(lease.keys, lease.id);
  }
}

/** Take a shared slot, run the tutor work, always release. Fail-fast if the fleet is full. */
export async function withAiSlot<T>(
  opts: { kind: AiSlotKind; userId: string; schoolId: string | null },
  fn: () => Promise<T>,
): Promise<T> {
  const lease = await acquireSlot(opts.kind, opts.userId, opts.schoolId);
  if (!lease) {
    throw new ApiError(
      'AI_RATE_LIMIT',
      'The tutor is helping other students right now — try again in a moment.',
    );
  }
  try {
    return await fn();
  } finally {
    await releaseSlot(lease);
  }
}
