// Endpoint POST /api/cancelar — Desinscrição / Supressão de E-mail IntegraSis com Cloudflare D1
// GET/HEAD nunca gravam supressão (proteção anti-scanner).

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtmlResult(title, message, isError = false) {
  const color = isError ? '#a04040' : '#4a7a4a';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)} — Integra Sistêmica</title>
<link rel="stylesheet" href="/assets/css/design-system.css?v=8">
<style>
  body{background:var(--creme);color:var(--ink);font-family:var(--font-body);margin:0;padding:48px 20px}
  .card{max-width:520px;margin:0 auto;background:var(--surface);border-radius:var(--r-lg);box-shadow:var(--shadow-card);padding:40px 32px;text-align:center}
  h1{font-family:var(--font-display);color:var(--marrom);font-size:2rem;margin:0 0 14px}
  p{font-size:1.05rem;line-height:1.6;color:${color};margin:0 0 24px}
  a.btn{display:inline-block;padding:12px 24px;border-radius:var(--r-pill);background:var(--marrom);color:var(--surface);font-family:var(--font-ui);font-size:0.95rem;text-decoration:none}
</style>
</head>
<body>
  <main class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a class="btn" href="/">Voltar ao site</a>
  </main>
</body>
</html>`;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    const email = (url.searchParams.get('email') || '').trim();
    const target = new URL('/cancelar-inscricao/', url.origin);
    if (email) target.searchParams.set('email', email);
    return Response.redirect(target.toString(), 302);
  }
  return new Response(JSON.stringify({
    success: false,
    error: 'Método não permitido. Use POST para confirmar o cancelamento.'
  }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestHead() {
  return new Response(null, {
    status: 405,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost({ request, env }) {
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';
  const wantsHtml = contentType.includes('application/x-www-form-urlencoded') &&
    accept.includes('text/html') &&
    !accept.includes('application/json');

  try {
    let body = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      const text = await request.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch (e) {
          const params = new URLSearchParams(text);
          body = Object.fromEntries(params);
        }
      }
    }

    // Honeypot anti-bot: humanos nunca preenchem este campo oculto
    if ((body.website || '').trim() !== '') {
      if (wantsHtml) {
        return new Response(renderHtmlResult('Requisição inválida', 'Não foi possível validar sua solicitação.', true), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: 'Requisição inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const email = (body.email || '').trim().toLowerCase();
    const motivo = (body.motivo || '').trim().substring(0, 120);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (wantsHtml) {
        return new Response(renderHtmlResult('E-mail inválido', 'Informe um endereço de e-mail válido para cancelar a inscrição.', true), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
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

    if (wantsHtml) {
      return new Response(
        renderHtmlResult('Inscrição cancelada', `O e-mail ${email} foi removido da nossa lista. Você não receberá mais nossas mensagens.`),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    return new Response(JSON.stringify({ success: true, message: 'Inscrição cancelada com sucesso' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    if (wantsHtml) {
      return new Response(renderHtmlResult('Erro ao cancelar', 'Ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.', true), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
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
