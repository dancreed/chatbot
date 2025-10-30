// src/app/api/test-env/route.ts

declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export async function GET() {
  // Test presence and mask actual token
  return Response.json({
    token: !!process.env.CLOUDFLARE_API_TOKEN ? "present" : "missing"
  });
}
