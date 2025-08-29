import { NextRequest } from "next/server";

// Replace with your actual Cloudflare AI endpoint and account/model!
const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-2-7b-chat-fp16";

export async function POST(req: NextRequest) {
  const body = await req.json() as { message?: string };
  const message = body.message ?? "";

  try {
    const aiRes = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: JSON.stringify({
        prompt: message
        // Use 'messages' instead of 'prompt' if your model requires full chat history
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("[Cloudflare AI Error]", aiRes.status, errorText);
      return Response.json({ response: `AI error: ${aiRes.status} ${errorText}` });
    }

    const aiData = await aiRes.json() as { result?: string; response?: string };
    const aiMessage = aiData.result ?? aiData.response ?? "(No AI response)";
    return Response.json({ response: aiMessage });
  } catch (err) {
    console.error("[AI Proxy Error]", err);
    return Response.json({
      response: `AI fetch error: ${err instanceof Error ? err.message : String(err)}`
    });
  }
}
