// Endpoint POST /api/telemetry — Dwell Time & Scroll Depth Tracker (IntegraSis)
// Consolida múltiplos beacons da mesma sessão em uma única linha por session_id no D1.
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
    const seconds = Math.max(0, parseInt(data.seconds, 10) || 0);
    const maxScroll = Math.min(100, Math.max(0, parseInt(data.max_scroll_percent, 10) || 0));
    const sessionId = (data.session_id || '').trim().substring(0, 64) || null;

    if (seconds > 0 && env.DB) {
      const userAgent = (request.headers.get('user-agent') || '').substring(0, 255);
      const ip = request.headers.get('cf-connecting-ip') || '';

      if (sessionId) {
        // Transação atômica via batch: atualiza a linha existente da sessão (via idx_pdt_session_id)
        // ou insere apenas se ainda não existir registro para este session_id.
        const updateStmt = env.DB.prepare(
          `UPDATE page_dwell_time
              SET seconds = MAX(COALESCE(seconds, 0), ?1),
                  max_scroll_percent = MAX(COALESCE(max_scroll_percent, 0), ?2),
                  email = COALESCE(NULLIF(email, ''), ?3),
                  page_path = COALESCE(NULLIF(page_path, ''), ?4),
                  user_agent = COALESCE(NULLIF(user_agent, ''), ?5),
                  ip = COALESCE(NULLIF(ip, ''), ?6)
            WHERE id = (
              SELECT id FROM page_dwell_time
               WHERE session_id = ?7
               ORDER BY id DESC
               LIMIT 1
            )`
        ).bind(seconds, maxScroll, email, pagePath, userAgent, ip, sessionId);

        const insertStmt = env.DB.prepare(
          `INSERT INTO page_dwell_time (email, page_path, seconds, max_scroll_percent, session_id, user_agent, ip, created_at)
           SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now')
            WHERE NOT EXISTS (
              SELECT 1 FROM page_dwell_time WHERE session_id = ?5
            )`
        ).bind(email, pagePath, seconds, maxScroll, sessionId, userAgent, ip);

        await env.DB.batch([updateStmt, insertStmt]);
      } else {
        await env.DB.prepare(
          `INSERT INTO page_dwell_time (email, page_path, seconds, max_scroll_percent, session_id, user_agent, ip, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(email, pagePath, seconds, maxScroll, null, userAgent, ip).run();
      }
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

export async function onRequestGet() {
  return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': 'POST, OPTIONS'
    }
  });
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
