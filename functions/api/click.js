// Endpoint GET /api/click — Rastreamento de Cliques em E-mails com Cloudflare D1
export async function onRequestGet({ request, env }) {
  const urlObj = new URL(request.url);
  let targetUrl = urlObj.searchParams.get('url') || 'https://integrasistemica.com.br';
  const email = (urlObj.searchParams.get('email') || '').trim().toLowerCase();
  const campaign = (urlObj.searchParams.get('c') || '').trim();
  const token = (urlObj.searchParams.get('t') || '').trim();

  if (email && env.DB) {
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('cf-connecting-ip') || '';
    const location = request.headers.get('cf-ipcountry') || '';

    try {
      await env.DB.prepare(
        "INSERT INTO email_clicks (email, token, campaign, clicked_at, user_agent, ip, location, url) VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?)"
      ).bind(email, token || null, campaign, userAgent, ip, location, targetUrl).run();

      await env.DB.prepare(
        "UPDATE email_journey_contacts SET last_engagement_at = datetime('now'), consecutive_misses = 0, updated_at = datetime('now') WHERE email_normalized = ?"
      ).bind(email).run();
    } catch (e) {
      // Ignora erro para garantir redirecionamento do usuário
    }
  }

  // Se o destino for o domínio do IntegraSis, repassa o e-mail para a telemetria do artigo
  if (email && (targetUrl.startsWith('/') || targetUrl.includes('integrasistemica.com.br'))) {
    try {
      const destUrl = new URL(targetUrl, 'https://integrasistemica.com.br');
      if (!destUrl.searchParams.has('email')) {
        destUrl.searchParams.set('email', email);
      }
      targetUrl = destUrl.toString();
    } catch (e) {}
  }

  // Redireciona imediatamente para o destino
  return Response.redirect(targetUrl, 302);
}
