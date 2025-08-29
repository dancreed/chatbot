import { NextRequest } from "next/server";

const AI_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/1443bf3700478d04e685484953259e23/ai/run/@cf/meta/llama-2-7b-chat-fp16";

export async function POST(req: NextRequest) {
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    return Response.json({ response: "Missing AI API token." });
  }

  let body;
  try {
    body = await req.json() as { message?: string };
  } catch (err) {
    return Response.json({ response: `Error parsing request body: ${err instanceof Error ? err.message : String(err)}` });
  }
  const message = body.message ?? "";

  try {
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

    const contentType = aiRes.headers.get('content-type');
    let responsePayload: Record<string, unknown> | string;
    if (contentType && contentType.includes('application/json')) {
      responsePayload = await aiRes.json() as Record<string, unknown>;
      console.log("[AI ROUTE] Full response from Cloudflare:", responsePayload);
      // Return the whole payload for debugging!
      return Response.json({ response: responsePayload });
    } else {
      const errorText = await aiRes.text();
      return Response.json({ response: `AI error: ${aiRes.status} [Non-JSON]: ${errorText.slice(0, 300)}` });
    }
  } catch (err) {
    return Response.json({
      response: `AI fetch error: ${err instanceof Error ? err.message : String(err)}`
    });
  }
}
