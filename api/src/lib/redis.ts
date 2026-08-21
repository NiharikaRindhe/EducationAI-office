import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

let client: RedisClientType | null = null;
let connectAttempt: Promise<RedisClientType | null> | null = null;

export function redisConfigured(): boolean {
  return Boolean(env.redisUrl.trim());
}

/** Connect once at boot. Returns null if Redis is unset or unreachable — callers must fall back. */
export async function connectRedis(): Promise<RedisClientType | null> {
  if (!redisConfigured()) return null;
  if (client?.isOpen) return client;
  if (connectAttempt) return connectAttempt;

  connectAttempt = (async () => {
    const next = createClient({ url: env.redisUrl.trim() });
    next.on('error', (err) => {
      logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Redis client error');
    });
    try {
      await next.connect();
      client = next;
      logger.info('Redis connected');
      return next;
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'Redis unavailable — AI slots fall back per process',
      );
      connectAttempt = null;
      client = null;
      return null;
    }
  })();

  return connectAttempt;
}

export async function getRedis(): Promise<RedisClientType | null> {
  if (!redisConfigured()) return null;
  if (client?.isOpen) return client;
  return connectRedis();
}

export async function disconnectRedis(): Promise<void> {
  const current = client;
  client = null;
  connectAttempt = null;
  if (current?.isOpen) await current.quit().catch(() => undefined);
}

export async function redisHealth(): Promise<'off' | 'up' | 'down'> {
  if (!redisConfigured()) return 'off';
  const r = await getRedis();
  if (!r?.isOpen) return 'down';
  try {
    await r.ping();
    return 'up';
  } catch {
    return 'down';
  }
}
