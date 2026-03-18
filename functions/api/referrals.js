export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.REFERRALS_DB) {
    return new Response(JSON.stringify({ error: 'REFERRALS_DB not bound' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { sharer_id, scanned_at, user_agent } = body;

      if (!sharer_id) {
        return new Response(JSON.stringify({ error: 'sharer_id required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

      await env.REFERRALS_DB.prepare(
        'INSERT INTO referrals (sharer_id, scanned_at, user_agent, ip) VALUES (?, ?, ?, ?)'
      ).bind(
        String(sharer_id),
        scanned_at || new Date().toISOString(),
        user_agent || '',
        ip
      ).run();

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  if (request.method === 'GET') {
    try {
      const { results } = await env.REFERRALS_DB.prepare(
        `SELECT sharer_id, scanned_at, ip, created_at
         FROM referrals
         ORDER BY created_at DESC
         LIMIT 200`
      ).all();

      return new Response(JSON.stringify(results), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
