# Next.js on Cloudflare: Voice AI Assistant
This is a [Next.js](https://nextjs.org) pre-configured to run on Cloudflare using [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

Try it out: [Live Demo](https://nextjs-cloudflare-voice-ai.kylejaycampbell.workers.dev/)

## Getting Started
Note that I use yarn in this README, but you can remove yarn.lock and use npm, pnpm, or bun if you like

Update `worker-configuration.d.ts` by running:
```bash
cd worker && yarn cf-typegen
```

Leave the Durable Object Worker running. It serves as a local WebSocket server:
```bash
yarn dev
```

Run Next.js development server from root directory (the Durable Object server must also be running):

First, copy `.env.example` to `.env.local`
```bash
cp .env.example .env.local
```

Then, run:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Deploy on Cloudflare
Before deploying, log in with your Cloudflare account by running:
```bash
npx wrangler login
```
You will be directed to a web page asking you to log in to the Cloudflare dashboard. After you have logged in, you will be asked if Wrangler can make changes to your Cloudflare account. Scroll down and select Allow to continue.

Change into your Durable Object Worker directory:
```bash
cd worker
```

Deploy the Worker:
```bash
yarn deploy
```

Copy only the host from the generated Worker URL, excluding the protocol, and set NEXT_PUBLIC_WS_HOST in .env.local to this value (e.g., worker-unique-identifier.workers.dev).

Change into your root directory and deploy your Next.js app:

```bash
yarn deploy
```

Or [connect a Github or Gitlab repository](https://developers.cloudflare.com/workers/ci-cd/), and Cloudflare will automatically build and deploy each pull request you merge to your production branch.

## Community
If you found this useful and would like to join my free AI builders community: [Discord](https://discord.gg/v6nj7dShND)

## References

- [talk2ai - Cloudflare AI Voice Assistant ](https://github.com/megaconfidence/talk2ai/tree/main)
- [Build Live Cursors with Next.js, RPC, and Durable Objects](https://developers.cloudflare.com/workers/tutorials/live-cursors-with-nextjs-rpc-do/)