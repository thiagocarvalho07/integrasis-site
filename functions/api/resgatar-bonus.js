// Endpoint POST /api/resgatar-bonus — Resgate de Bônus do Ebook IntegraSis com Cloudflare D1
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
    const code = (body.code || '').trim().toUpperCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Digite um e-mail válido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (env.DB) {
      try {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO leads (email, nome, origem, status, created_at) VALUES (?, ?, ?, 'ativo', datetime('now'))"
        ).bind(email, 'Leitor Ebook (' + code + ')', 'resgate-bonus').run();

        const contactId = 'c_' + Math.random().toString(36).substring(2, 12);
        await env.DB.prepare(
          "INSERT OR IGNORE INTO email_journey_contacts (id, email, email_normalized, business_state, cohort, entry_path, created_at, updated_at) VALUES (?, ?, ?, 'active', 'ebook-buyer', 'resgate-bonus', datetime('now'), datetime('now'))"
        ).bind(contactId, email, email).run();
      } catch (e) {
        // Log interno, mas libera o bônus para o cliente
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Bônus resgatado com sucesso!',
      links: {
        guia: '/ebook/Guia-7-Perguntas-Sistemicas.pdf',
        checklist: '/ebook/checklist-7-perguntas.pdf'
      }
    }), {
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
