import { NextRequest } from "next/server";

const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/1443bf3700478d04e685484953259e23/ai/run/@cf/meta/llama-2-7b-chat-fp16";

export async function POST(req: NextRequest) {
  console.log("[AI ROUTE] Endpoint:", AI_ENDPOINT);
  console.log("[AI ROUTE] Token present?", !!process.env.CLOUDFLARE_API_TOKEN);

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.error("Missing CLOUDFLARE_API_TOKEN in runtime environment");
    return Response.json({ response: "Missing AI API token." });
  }

  let body;
  try {
    body = await req.json() as { message?: string };
  } catch (err) {
    console.error("[AI ROUTE] Error parsing request body:", err);
    return Response.json({ response: `Error parsing request body: ${err instanceof Error ? err.message : String(err)}` });
  }
  const message = body.message ?? "";

  try {
    console.log("[AI ROUTE] Sending request to Cloudflare AI...");
    const aiRes = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }]
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("[Cloudflare AI Error]", aiRes.status, errorText);
      return Response.json({ response: `AI error: ${aiRes.status} ${errorText}` });
    }

    const aiData = await aiRes.json() as { result?: string; response?: string };
    console.log("[AI ROUTE] AI response data:", aiData);
    const aiMessage = aiData.result ?? aiData.response ?? "(No AI response)";
    return Response.json({ response: aiMessage });
  } catch (err) {
    // Return full error string to the UI for diagnosis
    console.error("[AI Proxy Error]", err);
    return Response.json({
      response: `AI fetch error: ${err instanceof Error ? err.message : String(err)}`
    });
  }
}
