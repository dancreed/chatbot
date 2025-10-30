export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'error';

export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
  audioB64?: string;
  status?: ChatMessageStatus;
};

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'speaking' | 'error';

export interface VoiceChatState {
  messages: ChatMessage[];
  connected: boolean;
  status: ConnectionStatus;
  error: string | null;
  isRecording: boolean;
}

export function createMessage(
  text: string,
  sender: ChatMessage['sender'],
  audioB64?: string,
  status: ChatMessageStatus = 'sent'
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    sender,
    timestamp: new Date(),
    audioB64,
    status
  };
}
