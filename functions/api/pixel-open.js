// Endpoint GET /api/pixel-open — Rastreamento de Abertura de E-mails com Cloudflare D1
// Retorna um GIF 1x1 transparente imediatamente e registra a abertura
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const campaign = (url.searchParams.get('c') || 'jornada-etapa1').trim();
  const token = (url.searchParams.get('t') || '').trim();

  // 1x1 transparent GIF (43 bytes)
  const pixelBytes = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
  ]);

  if (email && env.DB) {
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('cf-connecting-ip') || '';
    const location = request.headers.get('cf-ipcountry') || '';

    // Gravação assíncrona não bloqueia o retorno do pixel
    try {
      await env.DB.prepare(
        "INSERT INTO email_opens (email, token, campaign, opened_at, user_agent, ip, location) VALUES (?, ?, ?, datetime('now'), ?, ?, ?)"
      ).bind(email, token || null, campaign, userAgent, ip, location).run();

      await env.DB.prepare(
        "UPDATE email_journey_contacts SET last_engagement_at = datetime('now'), consecutive_misses = 0, updated_at = datetime('now') WHERE email_normalized = ?"
      ).bind(email).run();
    } catch (e) {
      // Ignora erro em telemetria para não quebrar carregamento
    }
  }

  return new Response(pixelBytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
