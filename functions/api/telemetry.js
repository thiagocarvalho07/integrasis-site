// Endpoint POST /api/telemetry — Dwell Time & Scroll Depth Tracker (IntegraSis)
export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let data = {};

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = {};
      }
    }

    const email = (data.email || '').trim().toLowerCase() || null;
    const pagePath = (data.path || '/').substring(0, 255);
    const seconds = parseInt(data.seconds, 10) || 0;
    const maxScroll = parseInt(data.max_scroll_percent, 10) || 0;
    const sessionId = (data.session_id || '').substring(0, 64) || null;

    if (seconds > 0 && env.DB) {
      const userAgent = (request.headers.get('user-agent') || '').substring(0, 255);
      const ip = request.headers.get('cf-connecting-ip') || '';

      await env.DB.prepare(
        `INSERT INTO page_dwell_time (email, page_path, seconds, max_scroll_percent, session_id, user_agent, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(email, pagePath, seconds, maxScroll, sessionId, userAgent, ip).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Suporte a OPTIONS (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
