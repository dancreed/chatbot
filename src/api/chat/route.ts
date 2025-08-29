import { NextRequest } from "next/server";

// Update these with your Cloudflare AI model and endpoint!
const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-2-7b-chat-fp16"; // Example endpoint

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // Call Cloudflare Workers AI
  const aiRes = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` // set this in .env.local
    },
    body: JSON.stringify({
      prompt: message
      // You may need 'messages: [...]' depending on your model; check documentation.
    }),
  });

  if (!aiRes.ok) {
    return Response.json({ response: "AI error: Could not reach Cloudflare AI." });
  }

  const aiData = await aiRes.json();
  // This assumes the Cloudflare AI response contains { result: string }
  const aiMessage = aiData.result || aiData.response || "(No AI response)";
  return Response.json({ response: aiMessage });
}
