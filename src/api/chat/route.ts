import { NextRequest } from "next/server";
import { serverConfig } from "@/config";

export async function POST(req: NextRequest) {
  if (!serverConfig.ai.token) {
    return Response.json({ message: "Missing AI API token." });
  }

  let body;
  try {
    body = await req.json() as { message?: string };
  } catch (err) {
    return Response.json({
      message:
        `Error parsing request body: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  const message = body.message ?? "";

  try {
    const aiRes = await fetch(serverConfig.ai.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serverConfig.ai.token}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
      }),
    });

    const contentType = aiRes.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const responsePayload = await aiRes.json() as Record<string, unknown>;
      // Try preferred keys: result, response, choices, content
      let text = "";
      if (typeof responsePayload.result === "string") {
        text = responsePayload.result;
      } else if (typeof responsePayload.response === "string") {
        text = responsePayload.response;
      } else if (
        Array.isArray(responsePayload.choices) &&
        typeof responsePayload.choices[0]?.message?.content === "string"
      ) {
        text = responsePayload.choices[0].message.content;
      } else if (typeof responsePayload.content === "string") {
        text = responsePayload.content;
      } else {
        text = "(No AI response)";
      }
      return Response.json({ message: text });
    } else {
      // Always return valid JSON even on HTML/text error
      const errorText = await aiRes.text();
      return Response.json({
        message: `AI error: ${aiRes.status} [Non-JSON]: ${errorText.slice(0, 300)}`,
      });
    }
  } catch (err) {
    return Response.json({
      message: `AI fetch error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
