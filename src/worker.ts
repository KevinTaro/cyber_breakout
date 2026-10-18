/**
 * Cloudflare Worker Fallback Entrypoint
 * Handles API routes and serves assets if deployed via standard `wrangler deploy`
 */

interface Env {
  LEADERBOARD_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
  STATIC_ASSETS?: {
    fetch: (req: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname.startsWith('/api/stats')) {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'Cyber Breakout Edge Worker',
          runtime: 'Cloudflare Workers V8',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (url.pathname.startsWith('/api/leaderboard')) {
      if (request.method === 'GET') {
        let records = [];
        if (env.LEADERBOARD_KV) {
          const raw = await env.LEADERBOARD_KV.get('top_scores');
          if (raw) records = JSON.parse(raw);
        }
        return new Response(JSON.stringify({ success: true, data: records }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Try serving assets if available
    if (env.STATIC_ASSETS) {
      return env.STATIC_ASSETS.fetch(request);
    }

    return new Response('Cyber Breakout Edge Worker Active', { status: 200 });
  },
};
