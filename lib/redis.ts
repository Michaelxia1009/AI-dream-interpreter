import { Redis } from '@upstash/redis';

let _client: Redis | null = null;

/**
 * Shared Upstash Redis client. Lazily instantiated so that build-time
 * imports don't require env vars to be present.
 */
export function getRedis(): Redis {
  if (_client) return _client;
  _client = Redis.fromEnv();
  return _client;
}
