import { NextRequest } from "next/server";

// Replace with your actual Cloudflare AI endpoint and account ID/model as needed.
const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-2-7b-chat-fp16";

export async function POST(req: NextRequest) {
  // Safely parse and typecheck incoming JSON
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
      // Change to 'messages' array if your model requires chat history, per Cloudflare docs.
    }),
  });

  if (!aiRes.ok) {
    return Response.json({ response: "AI error: Could not reach Cloudflare AI." });
  }

  // Type the response for TypeScript
  const aiData = await aiRes.json() as { result?: string; response?: string };
  const aiMessage = aiData.result ?? aiData.response ?? "(No AI response)";
  return Response.json({ response: aiMessage });
}
