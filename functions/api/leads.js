// Endpoint POST /api/leads — Captura de Leads IntegraSis com Cloudflare D1
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
    const nome = (body.nome || '').trim();
    const origem = (body.origem || 'landing-ebook').trim();

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

    // 1. Gravar na tabela leads
    await env.DB.prepare(
      "INSERT OR REPLACE INTO leads (email, nome, origem, status, created_at) VALUES (?, ?, ?, 'ativo', datetime('now'))"
    ).bind(email, nome || null, origem).run();

    // 2. Garantir contato na jornada
    const contactId = 'c_' + Math.random().toString(36).substring(2, 12);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO email_journey_contacts (id, email, email_normalized, business_state, cohort, entry_path, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, datetime('now'), datetime('now'))"
    ).bind(contactId, email, email, origem, origem).run();

    return new Response(JSON.stringify({ success: true, message: 'Lead capturado com sucesso' }), {
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
