// Server-side agentic loop — Anthropic API key never reaches the browser

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const RETAILERS = ["ASOS", "Zalando", "Zara", "H&M", "Uniqlo", "Mango", "Shein", "Pull&Bear"];

const SYSTEM = `You are a fashion price intelligence agent for a shopping comparison website.

Use web_search to find real current prices for the item across these 8 retailers: ${RETAILERS.join(", ")}.

Good search patterns:
- "[item] ASOS price buy 2024"
- "[item] Zalando EUR shop"
- "[item] Zara price"

After ALL searches, respond ONLY with a raw JSON array — no markdown, no code fences, just the array.

Each object must have:
{
  "retailer": "ASOS",
  "name": "Specific product name with material/fit details",
  "description": "One sentence, material, fit, style — max 85 chars",
  "price": 39.99,
  "originalPrice": null,
  "currency": "EUR",
  "url": "https://actual-url-or-null",
  "inStock": true,
  "sizes": ["28","29","30","32","34"],
  "rating": 4.2,
  "reviewCount": 3840,
  "badge": null
}

badge = "Best Deal" | "Sale" | "New In" | null.
Make prices realistic and meaningfully varied. ASOS/H&M/Shein tend cheaper, Zara/Zalando mid-range, Mango premium.`;

function sse(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), { status: 500 });
  }

  const { query } = await req.json();

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }
  if (query.length > 200) {
    return new Response(JSON.stringify({ error: "Query too long (max 200 characters)" }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(sse(data)));
  };

  (async () => {
    try {
      await send({ type: "init", text: `Searching for "${query}" across ${RETAILERS.length} retailers…` });

      const messages: Anthropic.MessageParam[] = [
        {
          role: "user",
          content: `Find current prices for: "${query}" — search all 8 retailers then return the JSON array.`,
        },
      ];

      let iter = 0;
      while (iter < 12) {
        iter++;

        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM,
          tools: [{ type: "web_search_20250305" as any, name: "web_search" } as any],
          messages,
        });

        const { content, stop_reason } = response;

        for (const block of content) {
          if (block.type === "tool_use" && block.name === "web_search") {
            const q = (block.input as { query?: string })?.query ?? "";
            await send({ type: "search", text: q });
          }
          if ((block as any).type === "web_search_tool_result") {
            const count = (block as any).content?.length ?? 0;
            await send({ type: "found", text: `${count} results retrieved` });
          }
        }

        if (stop_reason === "end_turn") {
          const text = (content.find((b) => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? "";
          const match = text.replace(/```json|```/g, "").match(/\[[\s\S]*\]/);
          if (!match) throw new Error("No JSON array in response");
          let results: unknown[];
          try {
            results = JSON.parse(match[0]);
          } catch {
            throw new Error("Failed to parse JSON from response");
          }
          await send({ type: "done", text: `✓ ${results.length} results found`, results });
          return;
        }

        if (stop_reason === "tool_use") {
          messages.push({ role: "assistant", content });
          const acks = content
            .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
            .map((b) => ({ type: "tool_result" as const, tool_use_id: b.id, content: "Done." }));
          if (acks.length) messages.push({ role: "user", content: acks });
          continue;
        }

        throw new Error(`Unexpected stop_reason: ${stop_reason}`);
      }

      throw new Error("Agent did not finish within max iterations");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await send({ type: "error", text: msg });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
