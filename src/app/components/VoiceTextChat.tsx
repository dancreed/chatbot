"use client";
console.log("VoiceTextChat component is rendering!");
import React, { useState, useRef } from "react";

// Minimal in-file type declarations
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResult[];
}
type SpeechRecognitionConstructor = new () => SpeechRecognition;
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export default function VoiceTextChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "ai" }[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognitionClass: SpeechRecognitionConstructor = 
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor, webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor, webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition!;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition not supported!");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const speech = event.results?.[0]?.[0]?.transcript;
      if (speech) handleSend(speech);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSend = (txt?: string) => {
    const message = txt ?? input;
    if (!message.trim()) return;
    setMessages((msgs) => [...msgs, { text: message, sender: "user" }]);
    setInput("");
    setTimeout(() => {
      setMessages((msgs) => [...msgs, { text: `AI: ${message}`, sender: "ai" }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="py-8 text-4xl font-bold text-center tracking-tight">
        AI Chatbot
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-end pt-4 pb-32">
        <div className="chat-window w-full bg-white text-black p-6 rounded-lg mb-6 shadow-lg max-h-[40vh] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`mb-4 ${m.sender === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block px-4 py-2 rounded-xl ${m.sender === "user" ? "bg-black text-white" : "bg-gray-200 text-black"}`}>
                {m.text}
              </span>
            </div>
          ))}
          {listening && (
            <div className="my-4 text-center text-yellow-500 animate-pulse font-semibold">
              Listening...
            </div>
          )}
        </div>
      </main>
      {/* Fixed input bar at the bottom */}
      <div
        className="w-full"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "#222",
          padding: "20px 0 16px 0",
          borderTop: "2px solid #444",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className="flex w-full max-w-2xl gap-2 px-4">
          <input
            style={{ background: "white", color: "black", padding: "12px", borderRadius: "99px", fontSize: 20, border: "1.5px solid #aaa" }}
            className="flex-1"
            type="text"
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Chat message"
          />
          <button
            style={{ background: "limegreen", color: "black", fontWeight: "bold", borderRadius: "999px", padding: "0 20px", fontSize: 18 }}
            onClick={() => handleSend()}
            aria-label="Send message"
          >
            Send
          </button>
          <button
            style={{
              background: listening ? "orange" : "white",
              borderRadius: "999px",
              border: "2px solid green",
              marginLeft: "8px",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => !listening && startListening()}
            aria-label="Start speech input"
          >
            <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <rect x="9" y="8" width="6" height="8" rx="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
