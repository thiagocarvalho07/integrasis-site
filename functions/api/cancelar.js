// Endpoint POST /api/cancelar — Desinscrição / Supressão de E-mail IntegraSis com Cloudflare D1
export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    const email = (body.email || '').trim().toLowerCase();
    const motivo = (body.motivo || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'E-mail inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, error: 'Banco D1 não configurado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Gravar em email_suppressions
    await env.DB.prepare(
      "INSERT OR REPLACE INTO email_suppressions (email, motivo, created_at) VALUES (?, ?, datetime('now'))"
    ).bind(email, motivo || null).run();

    // 2. Atualizar estado na tabela de contatos da jornada
    await env.DB.prepare(
      "UPDATE email_journey_contacts SET business_state = 'suppressed', suppressed_at = datetime('now'), updated_at = datetime('now') WHERE email_normalized = ?"
    ).bind(email).run();

    return new Response(JSON.stringify({ success: true, message: 'Inscrição cancelada com sucesso' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

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
