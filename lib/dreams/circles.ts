import { randomUUID } from 'node:crypto';
import { getRedis } from '@/lib/redis';
import { getDream } from './repo';
import type { DreamRecord } from './types';

export interface Circle {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  inviteCode: string;
}

export interface CircleSummary extends Circle {
  memberCount: number;
  sharedDreamCount: number;
}

export interface CircleComment {
  id: string;
  dreamId: string;
  authorFp: string;
  content: string;
  emoji: string | null;
  createdAt: number;
}

export interface CircleDream {
  id: string;
  createdAt: number;
  sharedAt: number;
  blurb: string;
  format: DreamRecord['format'];
  styleName: string;
  thumbnailUrl: string | null;
  metrics: DreamRecord['metrics'];
  symbols: string[];
  comments: CircleComment[];
}

export interface CircleDetail extends CircleSummary {
  isMember: boolean;
  dreams: CircleDream[];
}

const CIRCLE_TTL_SECONDS = 180 * 24 * 60 * 60;

function circleKey(id: string): string {
  return `circle:${id}`;
}

function membersKey(id: string): string {
  return `circle:${id}:members`;
}

function dreamsKey(id: string): string {
  return `circle:${id}:dreams`;
}

function commentsKey(id: string): string {
  return `circle:${id}:comments`;
}

function userCirclesKey(fpHash: string): string {
  return `circles:${fpHash}`;
}

function inviteKey(code: string): string {
  return `invite:${code}`;
}

function codeFromId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function thumbnailFor(dream: DreamRecord): string | null {
  if (dream.generation.kind === 'carousel') return dream.generation.imageUrls[0] ?? null;
  return null;
}

async function getCircle(id: string): Promise<Circle | null> {
  const raw = await getRedis().get<Circle | string>(circleKey(id));
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Circle;
    } catch {
      return null;
    }
  }
  return raw;
}

async function touchCircle(id: string, fpHashes: string[] = []): Promise<void> {
  const redis = getRedis();
  await Promise.all([
    redis.expire(circleKey(id), CIRCLE_TTL_SECONDS),
    redis.expire(membersKey(id), CIRCLE_TTL_SECONDS),
    redis.expire(dreamsKey(id), CIRCLE_TTL_SECONDS),
    redis.expire(commentsKey(id), CIRCLE_TTL_SECONDS),
    ...fpHashes.map(fp => redis.expire(userCirclesKey(fp), CIRCLE_TTL_SECONDS)),
  ]);
}

export async function createCircle(input: {
  name: string;
  description?: string;
  fpHash: string;
}): Promise<CircleSummary> {
  const redis = getRedis();
  const id = randomUUID();
  const circle: Circle = {
    id,
    name: input.name.trim().slice(0, 48),
    description: (input.description ?? '').trim().slice(0, 160),
    createdBy: input.fpHash,
    createdAt: Date.now(),
    inviteCode: codeFromId(id),
  };

  await Promise.all([
    redis.set(circleKey(id), JSON.stringify(circle), { ex: CIRCLE_TTL_SECONDS }),
    redis.sadd(membersKey(id), input.fpHash),
    redis.sadd(userCirclesKey(input.fpHash), id),
    redis.set(inviteKey(circle.inviteCode), id, { ex: CIRCLE_TTL_SECONDS }),
  ]);
  await touchCircle(id, [input.fpHash]);

  return { ...circle, memberCount: 1, sharedDreamCount: 0 };
}

export async function joinCircleByInvite(inviteCode: string, fpHash: string): Promise<CircleSummary | null> {
  const redis = getRedis();
  const code = inviteCode.trim().toUpperCase();
  const circleId = await redis.get<string>(inviteKey(code));
  if (!circleId) return null;
  const circle = await getCircle(circleId);
  if (!circle) return null;

  await Promise.all([
    redis.sadd(membersKey(circle.id), fpHash),
    redis.sadd(userCirclesKey(fpHash), circle.id),
  ]);
  await touchCircle(circle.id, [fpHash]);
  return summarizeCircle(circle);
}

export async function isCircleMember(circleId: string, fpHash: string): Promise<boolean> {
  const value = await getRedis().sismember(membersKey(circleId), fpHash);
  return Boolean(value);
}

export async function listCirclesForUser(fpHash: string): Promise<CircleSummary[]> {
  const ids = await getRedis().smembers(userCirclesKey(fpHash)) as string[];
  const circles = await Promise.all((ids ?? []).map(id => getCircle(id)));
  const summaries = await Promise.all(
    circles.filter((c): c is Circle => c != null).map(c => summarizeCircle(c)),
  );
  return summaries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function summarizeCircle(circle: Circle): Promise<CircleSummary> {
  const redis = getRedis();
  const [memberCount, sharedDreamCount] = await Promise.all([
    redis.scard(membersKey(circle.id)),
    redis.zcard(dreamsKey(circle.id)),
  ]);
  return {
    ...circle,
    memberCount: Number(memberCount ?? 0),
    sharedDreamCount: Number(sharedDreamCount ?? 0),
  };
}

export async function getCircleDetail(circleId: string, fpHash: string): Promise<CircleDetail | null> {
  const circle = await getCircle(circleId);
  if (!circle) return null;
  const isMember = await isCircleMember(circleId, fpHash);
  if (!isMember) {
    return { ...(await summarizeCircle(circle)), isMember: false, dreams: [] };
  }

  const redis = getRedis();
  const [ids, rawComments] = await Promise.all([
    redis.zrange(dreamsKey(circleId), 0, 30, { rev: true }) as Promise<string[]>,
    redis.lrange(commentsKey(circleId), 0, 200) as Promise<string[]>,
  ]);
  const comments = parseComments(rawComments ?? []);
  const records = await Promise.all((ids ?? []).map(async id => {
    const dream = await getDream(id);
    if (!dream) return null;
    const sharedAt = await redis.zscore(dreamsKey(circleId), id);
    return dreamToCircleDream(dream, Number(sharedAt ?? dream.createdAt), comments);
  }));

  return {
    ...(await summarizeCircle(circle)),
    isMember: true,
    dreams: records.filter((d): d is CircleDream => d != null),
  };
}

export async function shareDreamToCircle(
  circleId: string,
  dreamId: string,
  fpHash: string,
): Promise<CircleDream | null> {
  const redis = getRedis();
  const [circle, member, dream] = await Promise.all([
    getCircle(circleId),
    isCircleMember(circleId, fpHash),
    getDream(dreamId),
  ]);
  if (!circle || !member || !dream) return null;
  if (dream.fpHash !== fpHash) return null;

  const sharedAt = Date.now();
  await redis.zadd(dreamsKey(circleId), { score: sharedAt, member: dreamId });
  await touchCircle(circleId, [fpHash]);
  return dreamToCircleDream(dream, sharedAt, []);
}

export async function addCircleComment(input: {
  circleId: string;
  dreamId: string;
  fpHash: string;
  content?: string;
  emoji?: string | null;
}): Promise<CircleComment | null> {
  const redis = getRedis();
  const member = await isCircleMember(input.circleId, input.fpHash);
  if (!member) return null;
  const sharedIds = await redis.zrange(dreamsKey(input.circleId), 0, 200, { rev: true }) as string[];
  if (!(sharedIds ?? []).includes(input.dreamId)) return null;

  const comment: CircleComment = {
    id: randomUUID(),
    dreamId: input.dreamId,
    authorFp: input.fpHash,
    content: (input.content ?? '').trim().slice(0, 280),
    emoji: input.emoji ? input.emoji.slice(0, 8) : null,
    createdAt: Date.now(),
  };
  if (!comment.content && !comment.emoji) return null;

  await redis.lpush(commentsKey(input.circleId), JSON.stringify(comment));
  await touchCircle(input.circleId, [input.fpHash]);
  return comment;
}

export async function getRecentOwnDreams(fpHash: string, limit = 12): Promise<CircleDream[]> {
  const { getUserDreamIds } = await import('./user-index');
  const ids = await getUserDreamIds(fpHash, { limit });
  const records = await Promise.all(ids.map(id => getDream(id)));
  return records
    .filter((d): d is DreamRecord => d != null && d.fpHash === fpHash)
    .map(d => dreamToCircleDream(d, d.createdAt, []));
}

function parseComments(raw: string[]): CircleComment[] {
  const out: CircleComment[] = [];
  for (const item of raw) {
    try {
      const parsed = JSON.parse(item) as CircleComment;
      if (parsed.id && parsed.dreamId) out.push(parsed);
    } catch {
      // Ignore malformed historical entries.
    }
  }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

function dreamToCircleDream(
  dream: DreamRecord,
  sharedAt: number,
  comments: CircleComment[],
): CircleDream {
  return {
    id: dream.id,
    createdAt: dream.createdAt,
    sharedAt,
    blurb: dream.blurb,
    format: dream.format,
    styleName: dream.styleName,
    thumbnailUrl: thumbnailFor(dream),
    metrics: dream.metrics,
    symbols: dream.symbols ?? [],
    comments: comments.filter(c => c.dreamId === dream.id),
  };
}
