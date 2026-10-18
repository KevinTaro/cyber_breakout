/**
 * Cloudflare Pages Functions Edge Handler
 * Path: /api/leaderboard
 * Supports Cloudflare Workers KV (env.LEADERBOARD_KV) with graceful fallback
 */

interface Env {
  LEADERBOARD_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
}

interface LeaderboardRecord {
  id: string;
  player: string;
  score: number;
  level: number;
  maxCombo: number;
  date: string;
  difficulty: string;
}

// In-memory fallback if KV is not bound
let inMemoryLeaderboard: LeaderboardRecord[] = [
  { id: '1', player: 'CYBER_NEXUS', score: 38400, level: 5, maxCombo: 34, date: '2026-10-18', difficulty: 'hard' },
  { id: '2', player: 'NEON_RUNNER', score: 29500, level: 4, maxCombo: 26, date: '2026-10-17', difficulty: 'normal' },
  { id: '3', player: 'GHOST_BYTE', score: 22100, level: 3, maxCombo: 19, date: '2026-10-16', difficulty: 'normal' },
  { id: '4', player: 'EDGE_WARRIOR', score: 17800, level: 2, maxCombo: 15, date: '2026-10-15', difficulty: 'easy' },
  { id: '5', player: 'ZERO_COOL', score: 12400, level: 1, maxCombo: 12, date: '2026-10-14', difficulty: 'normal' },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;

  try {
    let records: LeaderboardRecord[] = [];

    if (env.LEADERBOARD_KV) {
      const raw = await env.LEADERBOARD_KV.get('top_scores');
      if (raw) {
        records = JSON.parse(raw);
      } else {
        records = inMemoryLeaderboard;
      }
    } else {
      records = inMemoryLeaderboard;
    }

    records.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({
        success: true,
        source: env.LEADERBOARD_KV ? 'cloudflare-kv' : 'edge-memory',
        region: 'cloudflare-edge',
        data: records.slice(0, 20),
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg, data: inMemoryLeaderboard }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json()) as Partial<LeaderboardRecord>;

    if (!body.player || typeof body.score !== 'number') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload: player and numeric score required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const newRecord: LeaderboardRecord = {
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      player: String(body.player).slice(0, 16).trim() || 'ANONYMOUS',
      score: Math.max(0, Math.floor(body.score)),
      level: Number(body.level) || 1,
      maxCombo: Number(body.maxCombo) || 1,
      date: new Date().toISOString().split('T')[0],
      difficulty: String(body.difficulty || 'normal'),
    };

    let records: LeaderboardRecord[] = inMemoryLeaderboard;

    if (env.LEADERBOARD_KV) {
      const raw = await env.LEADERBOARD_KV.get('top_scores');
      if (raw) {
        records = JSON.parse(raw);
      }
    }

    records.push(newRecord);
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, 50); // Keep top 50

    if (env.LEADERBOARD_KV) {
      await env.LEADERBOARD_KV.put('top_scores', JSON.stringify(records));
    } else {
      inMemoryLeaderboard = records;
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: env.LEADERBOARD_KV ? 'cloudflare-kv' : 'edge-memory',
        record: newRecord,
        rank: records.findIndex(r => r.id === newRecord.id) + 1,
      }),
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
