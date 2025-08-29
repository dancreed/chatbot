import { NextRequest } from "next/server";

// Cloudflare AI endpoint details
const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-2-7b-chat-fp16";

export async function POST(req: NextRequest) {
  // Safely assert the JSON type
  const body = await req.json() as { message?: string };
  const message = body.message ?? "";

  // Call Cloudflare Workers AI
  const aiRes = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
    },
    body: JSON.stringify({
      prompt: message
      // You may need 'messages: [...]' for structured chat, reference model docs.
    }),
  });

  if (!aiRes.ok) {
    return Response.json({ response: "AI error: Could not reach Cloudflare AI." });
  }

  const aiData = await aiRes.json();
  const aiMessage = aiData.result || aiData.response || "(No AI response)";
  return Response.json({ response: aiMessage });
}
