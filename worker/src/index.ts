import { smoothStream, streamText, type CoreMessage } from 'ai';
import { DurableObject } from 'cloudflare:workers';
import { createWorkersAI } from 'workers-ai-provider';
import PQueue from 'p-queue';

export class MyDurableObject extends DurableObject {
  env: Env;
  msgHistory: CoreMessage[];
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
    this.msgHistory = [];
  }
  async fetch(request: Request) {
    // set up ws pipeline
    const webSocketPair = new WebSocketPair();
    const [socket, ws] = Object.values(webSocketPair);

    ws.accept();
    ws.send(JSON.stringify({ type: 'status', text: 'ready' }));

    const workersai = createWorkersAI({ binding: this.env.AI });
    const queue = new PQueue({ concurrency: 1 });

    ws.addEventListener('message', async (event) => {
      if (typeof event.data === 'string') {
        const { type, data } = JSON.parse(event.data);
        if (type === 'cmd' && data === 'clear') {
          this.msgHistory.length = 0;
        }
        return;
      }

      // 1. Transcribe audio (speech to text)
      const { text } = await this.env.AI.run('@cf/openai/whisper-tiny-en', {
        audio: [...new Uint8Array(event.data as ArrayBuffer)],
      });
      ws.send(JSON.stringify({ type: 'text', text }));

      this.msgHistory.push({ role: 'user', content: text });

      // 2. AI inference (chat completion)
      const result = streamText({
        model: workersai('@cf/meta/llama-3.1-8b-instruct'),
        system: 'You are a helpful assistant in a voice conversation with the user',
        messages: this.msgHistory,
        maxTokens: 160,
        temperature: 0.7,
        experimental_transform: smoothStream({
          delayInMs: null,
          chunking: (buf: string) => {
            const m = buf.match(/^(.+?[.!?])(?:\s+|$)/);
            if (m) return m[0];
            if (buf.length > 120) return buf;
            return null;
          },
        }),
      });

      let fullReply = '';
      for await (const chunk of result.textStream) {
        const sentence = String(chunk).trim();
        if (!sentence) continue;

        fullReply += (fullReply ? ' ' : '') + sentence;
        ws.send(JSON.stringify({ type: 'status', text: 'Speaking…' }));

        // 3. Cloudflare TTS (convert response to audio)
        void queue.add(async () => {
          const tts = await this.env.AI.run('@cf/myshell-ai/melotts', {
            prompt: sentence, // the AI's reply sentence
            voice: 'female_en_1', // choose any supported voice/model
          });

          let b64: string;
          if (typeof tts === 'string') {
            b64 = tts;
          } else if (tts && typeof tts === 'object' && 'audio' in tts) {
            b64 = tts.audio;
          } else {
            b64 = btoa(String.fromCharCode(...new Uint8Array(tts as ArrayBuffer)));
          }

          ws.send(JSON.stringify({ type: 'audio', text: sentence, audio: b64 }));
        });
      }

      await queue.onIdle();
      this.msgHistory.push({ role: 'assistant', content: fullReply });
      ws.send(JSON.stringify({ type: 'status', text: 'Idle' }));

      // Optional debug
      console.log('finishReason:', await result.finishReason);
    });

    ws.addEventListener('close', (cls) => {
      ws.close(cls.code, 'Durable Object is closing WebSocket');
    });

    return new Response(null, { status: 101, webSocket: socket });
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.url.endsWith('/websocket')) {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected upgrade to websocket', { status: 426 });
      }
      const id = env.MY_DURABLE_OBJECT.idFromName(crypto.randomUUID());
      const stub = env.MY_DURABLE_OBJECT.get(id);
      return stub.fetch(request);
    }
    return new Response(null, {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
