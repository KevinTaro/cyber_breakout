/**
 * Cloudflare Pages Functions Edge Handler
 * Path: /api/stats
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const cf = (request as unknown as { cf?: { colo?: string; country?: string; city?: string } }).cf;

  return new Response(
    JSON.stringify({
      status: 'online',
      service: 'Cyber Breakout Edge API',
      runtime: 'Cloudflare Pages Functions / V8 Worker',
      edgeLocation: cf?.colo || 'LOCAL_DEV',
      country: cf?.country || 'GLOBAL',
      timestamp: new Date().toISOString(),
      features: [
        'Global Edge Distribution',
        'Sub-10ms Cold Starts',
        'KV Storage Integration',
        'DDoS & Bot Protection',
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
