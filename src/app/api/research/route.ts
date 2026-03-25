import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a world-class AI researcher specializing in Artificial General Intelligence (AGI).
Your role is to provide deep, well-structured research analysis on AGI topics.

When responding:
- Provide thorough, evidence-based analysis
- Reference key researchers, papers, and institutions where relevant
- Discuss technical approaches, challenges, and timelines
- Consider safety, alignment, and ethical implications
- Structure your response with clear headings using markdown
- Be balanced — present multiple perspectives on contested topics
- Distinguish between established science, informed speculation, and open questions`;

export async function POST(request: Request) {
  const { topic, depth } = await request.json();

  if (!topic || typeof topic !== "string") {
    return Response.json({ error: "Topic is required" }, { status: 400 });
  }

  const depthInstruction =
    depth === "deep"
      ? "Provide an extensive, deeply technical analysis (1500+ words). Cover historical context, current state-of-the-art, key technical challenges, leading approaches, safety considerations, and future outlook."
      : depth === "brief"
        ? "Provide a concise but insightful summary (300-500 words) covering the key points."
        : "Provide a thorough analysis (800-1200 words) balancing depth with readability.";

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Research the following AGI topic in depth:\n\n**${topic}**\n\n${depthInstruction}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
