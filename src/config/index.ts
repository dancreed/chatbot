declare var process: {
  env: {
    [key: string]: string | undefined;
  };
};

// Client-side config (only NEXT_PUBLIC_ variables are available in browser)
export const clientConfig = {
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || "wss://worker.dan-creed.workers.dev/websocket"
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || ""
  }
} as const;

// Server-side config (all env variables available)
export const serverConfig = {
  ai: {
    endpoint: process.env.CLOUDFLARE_AI_ENDPOINT || "https://api.cloudflare.com/client/v4/accounts/1443bf3700478d04e685484953259e23/ai/run/@cf/meta/llama-2-7b-chat-fp16",
    token: process.env.CLOUDFLARE_API_TOKEN
  }
} as const;

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
