// Endpoint GET /api/download-stamped-pdf — Estampagem Dinâmica de PDF em Edge Runtime
// Parâmetros: file (book | guia | checklist), nome, cpf, email
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const fileType = url.searchParams.get("file") || "book";
    const nome = url.searchParams.get("nome") || "Leitor Autorizado";
    const rawCpf = url.searchParams.get("cpf") || "000.000.000-00";
    const email = url.searchParams.get("email") || "cliente@integrasistemica.com.br";

    // 1. Rastreamento e Telemetria no Cloudflare D1
    if (env.DB) {
      try {
        const clientIp = request.headers.get("cf-connecting-ip") || "0.0.0.0";
        const userAgent = request.headers.get("user-agent") || "";
        await env.DB.prepare(`
          INSERT INTO email_clicks (email, link_url, user_agent, ip, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(email, `download:${fileType}`, userAgent, clientIp).run();
      } catch (dbErr) {
        // Telemetria silenciosa para não travar o download
      }
    }

    // Mascaramento LGPD do CPF (***.456.789-**)
    let maskedCpf = rawCpf;
    const cleanDigits = rawCpf.replace(/\D/g, "");
    if (cleanDigits.length === 11) {
      maskedCpf = `***.${cleanDigits.substr(3, 3)}.${cleanDigits.substr(6, 3)}-**`;
    }

    // Mapeamento dos arquivos estáticos oficiais
    const origin = url.origin;
    let targetPdfUrl = "";
    let downloadFilename = "";

    if (fileType === "checklist") {
      targetPdfUrl = `${origin}/ebook/checklist-7-perguntas.pdf`;
      downloadFilename = `Checklist-Arvore-Familiar-${nome.replace(/\\s+/g, "_")}.pdf`;
    } else if (fileType === "guia") {
      targetPdfUrl = `${origin}/ebook/Guia-7-Perguntas-Sistemicas.pdf`;
      downloadFilename = `Guia-7-Perguntas-${nome.replace(/\\s+/g, "_")}.pdf`;
    } else {
      targetPdfUrl = `${origin}/ebook/Constelacao-Familiar-Thiago-Carvalho.pdf`;
      downloadFilename = `Ebook-Constelacao-Familiar-${nome.replace(/\\s+/g, "_")}.pdf`;
    }

    // Busca o PDF base
    const baseResp = await fetch(targetPdfUrl);
    if (!baseResp.ok) {
      return new Response("Arquivo base não encontrado no servidor", { status: 404 });
    }

    const pdfBuffer = await baseResp.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const watermarkText = `Exemplar licenciado exclusivamente para ${nome} • CPF: ${maskedCpf} • E-mail: ${email} • IntegraSis © 2026`;

    // Estampa o rodapé em todas as páginas (exceto capa do livro que é a página 0)
    for (let i = 0; i < pages.length; i++) {
      if (fileType === "book" && i === 0) {
        // Pula a capa do livro
        continue;
      }

      const page = pages[i];
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: 34,
        y: 12,
        size: 6.5,
        font: helveticaFont,
        color: rgb(0.42, 0.35, 0.28), // Marrom suave #6B5847
        opacity: 0.85
      });
    }

    const stampedPdfBytes = await pdfDoc.save();

    const disposition = url.searchParams.get("disposition") || "attachment";

    return new Response(stampedPdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${downloadFilename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });

  } catch (err) {
    return new Response("Erro ao estampar PDF: " + err.message, { status: 500 });
  }
}
