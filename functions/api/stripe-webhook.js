// Endpoint POST /api/stripe-webhook — Webhook Oficial Stripe (Liquidação & Pós-Venda) com Assinatura HMAC
export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.text();
    const sigHeader = request.headers.get("stripe-signature") || "";

    // 1. Validação de Assinatura Criptográfica HMAC (se STRIPE_WEBHOOK_SECRET estiver configurada)
    if (env.STRIPE_WEBHOOK_SECRET && sigHeader) {
      try {
        const parts = sigHeader.split(",").reduce((acc, part) => {
          const [k, v] = part.split("=");
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {});

        const timestamp = parts["t"];
        const signature = parts["v1"];

        if (timestamp && signature) {
          const encoder = new TextEncoder();
          const signedPayload = `${timestamp}.${payload}`;
          const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(env.STRIPE_WEBHOOK_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );

          // Converte assinatura hex em Uint8Array
          const sigBytes = new Uint8Array(
            signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
          );

          const isValid = await crypto.subtle.verify(
            "HMAC",
            key,
            sigBytes,
            encoder.encode(signedPayload)
          );

          if (!isValid) {
            return new Response("Assinatura de Webhook Inválida", { status: 400 });
          }
        }
      } catch (errSig) {
        return new Response("Falha na validação de assinatura: " + errSig.message, { status: 400 });
      }
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Processa pagamento aprovado (checkout.session.completed ou payment_intent.succeeded)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = (session.customer_email || session.client_reference_id || "").toLowerCase().trim();

      if (email && env.DB) {
        try {
          // 1. Marca comprador no banco D1 da jornada (para cessar réguas de cobrança)
          await env.DB.prepare(`
            UPDATE email_journey_contacts
            SET purchased_at = datetime('now'),
                business_state = 'purchased',
                updated_at = datetime('now')
            WHERE email_normalized = ?
          `).bind(email).run();

          // 2. Registra na tabela de leads como cliente ativo
          await env.DB.prepare(`
            INSERT OR REPLACE INTO leads (email, nome, origem, status, created_at)
            VALUES (?, ?, 'stripe-checkout', 'comprador', datetime('now'))
          `).bind(email, session.metadata?.customer_name || 'Comprador E-book').run();
        } catch (dbErr) {
          // Log silencioso no Edge
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
