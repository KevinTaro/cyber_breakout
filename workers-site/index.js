/**
 * Cloudflare Workers Site Entrypoint
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/stats')) {
      return new Response(JSON.stringify({ status: 'online', service: 'Cyber Breakout Edge Worker' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Cyber Breakout Online', { status: 200 });
  }
};
