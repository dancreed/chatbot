// src/app/api/test-env/route.ts

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Test presence and mask actual token
  return Response.json({
    token: !!process.env.CLOUDFLARE_API_TOKEN ? "present" : "missing"
  });
}
