// Seed a fake dream into Redis to smoke-test the read path end-to-end.
// Run with: node scripts/seed-smoke-dream.mjs [id] [isPublic]
import { readFileSync } from 'node:fs';
import { Redis } from '@upstash/redis';

// Load .env.local manually so we don't need dotenv as a dep.
try {
  const env = readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {
  console.warn('No .env.local found — relying on existing process env.');
}

const redis = Redis.fromEnv();

const id      = process.argv[2] ?? 'smoke-test-dream-1';
const isPublic = process.argv[3] !== 'false';
const isoWeek = '2026-W18';
const createdAt = Date.now();

const record = {
  id, createdAt, isoWeek,
  format: 'carousel',
  styleId: 'ghibli-dream',
  styleName: 'Studio Ghibli Dream',
  metrics: {
    weirdness:           { score: 9, oneLiner: 'The dreamweaver is taking notes.' },
    imagination:         { score: 7, oneLiner: 'A respectable flight of fancy.' },
    emotionalIntensity:  { score: 4, oneLiner: 'Emotionally, a light breeze.' },
    vividness:           { score: 8, oneLiner: 'Crystal-clear chaos.' },
  },
  generation: {
    kind: 'carousel',
    imageUrls: ['/api/blob?path=fake1.jpg', '/api/blob?path=fake2.jpg'],
    zipUrl: '/api/blob?path=fake.zip',
  },
  fpHash: 'a4f2deadbeefcafe',
  handle: 'Dreamer #A4F2',
  isPublic,
  moderation: { ok: true, flags: [] },
  blurb: 'A whale of stained glass surfaces in the church floor.',
};

const ttl = 8 * 24 * 60 * 60;
await redis.set(`dream:${id}`, JSON.stringify(record), { ex: ttl });

const computeRank = (m, ts) => m * 1e6 + (1e10 - Math.floor(ts / 1000));
if (isPublic) {
  await redis.zadd(`lb:weirdness:${isoWeek}`, { score: computeRank(9, createdAt), member: id });
  await redis.expire(`lb:weirdness:${isoWeek}`, ttl);
  await redis.zadd(`lb:vivid:${isoWeek}`,     { score: computeRank(8, createdAt), member: id });
  await redis.expire(`lb:vivid:${isoWeek}`, ttl);
  await redis.zadd(`lb:emotional:${isoWeek}`, { score: computeRank(4, createdAt), member: id });
  await redis.expire(`lb:emotional:${isoWeek}`, ttl);
}

console.log(JSON.stringify({ seeded: id, isPublic, isoWeek }));
