import { smoothStream, streamText, type CoreMessage } from 'ai';
import { DurableObject } from 'cloudflare:workers';
import { createWorkersAI } from 'workers-ai-provider';
import PQueue from 'p-queue';
export { MyDurableObject } from "./.build/durable-objects/my-durable-object.js";

/* Todo
 * ✅ 1. WS with frontend
 * ✅ 2. Get audio to backend
 * ✅ 3. Convert audio to text
 * ✅ 4. Run inference
 * ✅ 5. Convert result to audio
 * ✅ 6. Send audio to frontend
 */

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

		console.log('request', request.method, request.url);

		ws.accept();
		ws.send(JSON.stringify({ type: 'status', text: 'ready' })); // tell the client it’s safe to send
		const workersai = createWorkersAI({ binding: this.env.AI });
		const queue = new PQueue({ concurrency: 1 });

		ws.addEventListener('message', async (event) => {
			// handle chat commands
			if (typeof event.data === 'string') {
				const { type, data } = JSON.parse(event.data);
				if (type === 'cmd' && data === 'clear') {
					this.msgHistory.length = 0; // clear chat history
				}
				return; // end processing here for this event type
			}

			// transcribe audio buffer to text (stt)
			const { text } = await this.env.AI.run('@cf/openai/whisper-tiny-en', {
				audio: [...new Uint8Array(event.data as ArrayBuffer)],
			});
			console.log('>>', text);
			ws.send(JSON.stringify({ type: 'text', text })); // send transcription to client
			this.msgHistory.push({ role: 'user', content: text });

			// run inference
			console.log('Starting inference...');

			const result = streamText({
				model: workersai('@cf/meta/llama-3.1-8b-instruct'),
				system: 'You are a helpful assistant in a voice conversation with the user',
				messages: this.msgHistory,
				maxTokens: 160,
				temperature: 0.7,
				// IMPORTANT: sentence chunking, no artificial delay
				experimental_transform: smoothStream({
					delayInMs: null,
					chunking: (buf: string) => {
						// emit a sentence if we see ., !, ? followed by space/end
						const m = buf.match(/^(.+?[.!?])(?:\s+|$)/);
						if (m) return m[0];
						// otherwise emit a clause if it’s getting long
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

				console.log('<<', sentence);

				// serialize TTS per sentence (keeps order) but don't block the reader too long
				// DO NOT await here – let the reader continue; queue enforces order=1
				void queue.add(async () => {
					const tts = await this.env.AI.run('@cf/myshell-ai/melotts', { prompt: sentence });

					// normalize to a base64 string
					let b64: string;
					if (typeof tts === 'string') {
						b64 = tts;
					} else if (tts && typeof tts === 'object' && 'audio' in tts) {
						b64 = (tts as { audio: string }).audio;
					} else {
						// Convert Uint8Array to base64
						b64 = btoa(String.fromCharCode(...new Uint8Array(tts as ArrayBuffer)));
					}

					ws.send(JSON.stringify({ type: 'audio', text: sentence, audio: b64 }));
				});
			}

			// wait for audio queue to drain before closing the turn
			await queue.onIdle();

			// Only after the model finishes: add one assistant turn to history
			this.msgHistory.push({ role: 'assistant', content: fullReply });
			ws.send(JSON.stringify({ type: 'status', text: 'Idle' }));

			// Optional debug:
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
		console.log('ctx.name:', ctx.props.name);
		if (request.url.endsWith('/websocket')) {
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Expected upgrade to websocket', { status: 426 });
			}
			const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(crypto.randomUUID());
			const stub = env.MY_DURABLE_OBJECT.get(id);
			return stub.fetch(request);
		}

		return new Response(null, {
			status: 400,
			statusText: 'Bad Request',
			headers: { 'Content-Type': 'text/plain' },
		});
	},
} satisfies ExportedHandler<Env>;
