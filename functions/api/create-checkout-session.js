// Endpoint POST /api/create-checkout-session — Integração Stripe Checkout (Pix & Cartão)
export async function onRequestPost({ request, env }) {
  try {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Chave secreta do Stripe não configurada nas variáveis do Cloudflare Pages." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const contentType = request.headers.get("content-type") || "";
    let body = {};
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    const email = (body.email || "").trim().toLowerCase();
    const nome = (body.nome || "").trim();
    const whatsapp = (body.whatsapp || "").trim();
    const cpf = (body.cpf || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, error: "Digite um e-mail válido." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Grava intenção de compra no D1 se configurado
    if (env.DB) {
      try {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO leads (email, nome, origem, status, created_at) VALUES (?, ?, 'checkout-iniciado', 'ativo', datetime('now'))"
        ).bind(email, nome || 'Cliente Checkout').run();
      } catch (e) {
        // Silencioso se D1 estiver ocupado
      }
    }

    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/checkout/sucesso.html?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}`;
    const cancelUrl = `${origin}/checkout/`;

    // Parâmetros para API da Stripe (x-www-form-urlencoded nativo)
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("customer_email", email);
    params.append("client_reference_id", email);

    // Métodos de pagamento dinâmicos (padrão moderno da Stripe 2026):
    // Como a nova conta utiliza a API mais recente, os métodos são gerenciados 100% no Dashboard
    // e auto-detectados conforme o dispositivo do comprador (Cartão, Apple Pay, Google Pay e Pix quando disponível).



    // Item do pedido: E-book 2ª Edição por R$ 29,90 (2990 centavos)
    params.append("line_items[0][price_data][currency]", "brl");
    params.append("line_items[0][price_data][unit_amount]", "2990");
    params.append("line_items[0][price_data][product_data][name]", "E-book Constelação Familiar: O Guia Prático da Reconciliação (2ª Edição)");
    params.append("line_items[0][price_data][product_data][description]", "Acesso imediato à 2ª Edição Revista e Ampliada em PDF e EPUB + Bônus.");
    params.append("line_items[0][price_data][product_data][images][0]", `${origin}/assets/img/ebook/capa-livro.webp`);
    params.append("line_items[0][quantity]", "1");

    // Metadados para tracking e reconciliação
    params.append("metadata[customer_name]", nome);
    params.append("metadata[customer_whatsapp]", whatsapp);
    params.append("metadata[customer_cpf]", cpf);
    params.append("metadata[product]", "ebook-constelacao-2ed");

    // Chamada à API oficial da Stripe
    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const sessionData = await stripeResp.json();

    if (!stripeResp.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: sessionData.error ? sessionData.error.message : "Erro ao criar sessão no Stripe." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url: sessionData.url,
      id: sessionData.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
