// Rota /cancelar-inscricao/ — Proteção anti-scanner + suporte RFC 8058 List-Unsubscribe=One-Click
// GET/HEAD nunca gravam supressão no D1; apenas servem a página HTML com formulário POST.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function onRequestGet({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  if (res.status !== 200) return res;

  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res;
  }

  return new HTMLRewriter()
    .on('#emailInput', {
      element(el) {
        el.setAttribute('value', email);
      }
    })
    .on('#emailBox', {
      element(el) {
        el.setInnerContent(email);
      }
    })
    .transform(res);
}

export async function onRequestHead({ request, env }) {
  return env.ASSETS.fetch(request);
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
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

    // Honeypot anti-bot
    if ((body.website || '').trim() !== '') {
      return new Response(JSON.stringify({ success: false, error: 'Requisição inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const isOneClick = String(body['List-Unsubscribe'] || '').trim().toLowerCase() === 'one-click';
    const bodyEmail = (body.email || '').trim().toLowerCase();
    const queryEmail = (url.searchParams.get('email') || '').trim().toLowerCase();

    // Proteção anti-scanner: POST vazio sem List-Unsubscribe=One-Click e sem email no corpo não descadastra
    if (!isOneClick && !bodyEmail) {
      if (wantsHtml) {
        return new Response(renderHtmlResult('Confirmação necessária', 'Use o formulário da página para confirmar o cancelamento da inscrição.', true), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Confirmação explícita necessária no corpo da requisição POST.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const email = bodyEmail || queryEmail;
    const motivo = isOneClick
      ? 'one-click-rfc8058'
      : (body.motivo || '').trim().substring(0, 120);

    if (!email || !EMAIL_RE.test(email)) {
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

    await env.DB.prepare(
      "INSERT OR REPLACE INTO email_suppressions (email, motivo, created_at) VALUES (?, ?, datetime('now'))"
    ).bind(email, motivo || null).run();

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
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
