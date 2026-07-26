/**
 * AI generator: takes a base64 product image (+ optional hint) and returns
 * SEO-friendly title, description and hashtags via Lovable AI (Gemini vision).
 */
import { createFileRoute } from "@tanstack/react-router";

type Body = { imageDataUrl?: string; hint?: string };

export const Route = createFileRoute("/api/generate-product-info")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (!body.imageDataUrl && !body.hint) {
          return new Response("provide imageDataUrl or hint", { status: 400 });
        }

        const content: Array<Record<string, unknown>> = [
          {
            type: "text",
            text: `Você é um copywriter de e-commerce. Analise ${
              body.imageDataUrl ? "a imagem do produto" : "a descrição"
            }${body.hint ? ` e a dica: "${body.hint}"` : ""} e retorne APENAS JSON válido no formato:
{"title": "string curta e vendedora (máx 60 chars)", "description": "descrição persuasiva 2-3 frases", "hashtags": ["tag1","tag2","tag3","tag4","tag5"], "category": "categoria curta"}
Sem markdown, sem \`\`\`, apenas o objeto JSON puro. Português brasileiro.`,
          },
        ];
        if (body.imageDataUrl) {
          content.push({ type: "image_url", image_url: { url: body.imageDataUrl } });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [{ role: "user", content }],
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          if (res.status === 429) return Response.json({ error: "Limite de IA atingido, tente em alguns instantes." }, { status: 429 });
          if (res.status === 402) return Response.json({ error: "Créditos de IA esgotados." }, { status: 402 });
          return Response.json({ error: txt }, { status: res.status });
        }

        const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = j.choices?.[0]?.message?.content ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return Response.json({ error: "IA não retornou JSON", raw }, { status: 502 });
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return Response.json(parsed);
        } catch {
          return Response.json({ error: "JSON inválido", raw }, { status: 502 });
        }
      },
    },
  },
});
