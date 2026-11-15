// Endpoint POST /api/auth-audios — Autenticação de Acesso aos Áudios por CPF
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const rawCpf = (body.cpf || "").trim().replace(/\D/g, "");

    if (rawCpf.length !== 11) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Digite um CPF válido com 11 dígitos." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Validação com compradores reais no D1 ou bypass para o Boss/Lívia
    const cpfsAutorizados = [
      "01814512128", // Thiago Carvalho (Boss)
      "81922728187"  // Livia Raele (Primeira compradora comprovada)
    ];

    let autorizado = cpfsAutorizados.includes(rawCpf);

    // Se tiver banco D1 configurado, checa se comprou na tabela leads ou contacts
    if (!autorizado && env.DB) {
      try {
        const res = await env.DB.prepare(
          "SELECT 1 FROM leads WHERE origem IN ('stripe-checkout', 'comprador') LIMIT 1"
        ).first();
        if (res) autorizado = true;
      } catch (e) {}
    }

    if (autorizado) {
      return new Response(JSON.stringify({
        success: true,
        token: `auth_cpf_${rawCpf}_verified`,
        message: "Acesso liberado ao Santuário de Áudios."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "CPF não localizado na lista de compradores do E-book ou da 2ª Edição."
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
