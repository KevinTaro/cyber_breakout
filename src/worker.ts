/**
 * Cloudflare Worker Entrypoint with Static Assets & Edge API Routes
 */

interface Env {
  LEADERBOARD_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
  ASSETS?: {
    fetch: (req: Request) => Promise<Response>;
  };
}

let inMemoryLeaderboard = [
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health / Stats API
    if (url.pathname.startsWith('/api/stats')) {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'Cyber Breakout Edge Worker',
          runtime: 'Cloudflare Workers V8 with Static Assets',
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Leaderboard API (GET & POST)
    if (url.pathname.startsWith('/api/leaderboard')) {
      if (request.method === 'GET') {
        let records = inMemoryLeaderboard;
        if (env.LEADERBOARD_KV) {
          const raw = await env.LEADERBOARD_KV.get('top_scores');
          if (raw) {
            try {
              records = JSON.parse(raw);
            } catch {
              // fallback
            }
          }
        }
        records.sort((a, b) => b.score - a.score);
        return new Response(
          JSON.stringify({
            success: true,
            source: env.LEADERBOARD_KV ? 'cloudflare-kv' : 'edge-memory',
            data: records.slice(0, 20),
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      if (request.method === 'POST') {
        try {
          const body = (await request.json()) as {
            player?: string;
            score?: number;
            level?: number;
            maxCombo?: number;
            difficulty?: string;
          };

          const newRecord = {
            id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            player: String(body.player || 'ANONYMOUS').slice(0, 16).trim(),
            score: Math.max(0, Math.floor(body.score || 0)),
            level: Number(body.level) || 1,
            maxCombo: Number(body.maxCombo) || 1,
            date: new Date().toISOString().split('T')[0],
            difficulty: String(body.difficulty || 'normal'),
          };

          let records = inMemoryLeaderboard;
          if (env.LEADERBOARD_KV) {
            const raw = await env.LEADERBOARD_KV.get('top_scores');
            if (raw) {
              try {
                records = JSON.parse(raw);
              } catch {
                // fallback
              }
            }
          }

          records.push(newRecord);
          records.sort((a, b) => b.score - a.score);
          records = records.slice(0, 50);

          if (env.LEADERBOARD_KV) {
            await env.LEADERBOARD_KV.put('top_scores', JSON.stringify(records));
          } else {
            inMemoryLeaderboard = records;
          }

          return new Response(
            JSON.stringify({ success: true, record: newRecord }),
            { status: 201, headers: CORS_HEADERS }
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // Serve static frontend assets from dist/
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      // SPA Fallback: if requesting a route that is not a static file, serve index.html
      if (response.status === 404 && !url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
      }
      return response;
    }

    return new Response('Cyber Breakout Edge Worker Active', { status: 200 });
  },
};
