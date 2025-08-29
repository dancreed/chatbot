"use client";

import React, { useState, useRef } from "react";
// Import types from the dom-speech-recognition package
import type { SpeechRecognition, SpeechRecognitionEvent } from "dom-speech-recognition";

export default function VoiceTextChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "ai" }[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Start browser speech recognition
  const startListening = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition not supported!");
      return;
    }
    const recognition: SpeechRecognition = new SpeechRecognitionClass();
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

  // Send message from either text input or speech
  const handleSend = (txt?: string) => {
    const message = txt ?? input;
    if (!message.trim()) return;
    setMessages([...messages, { text: message, sender: "user" }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages((msgs) => [...msgs, { text: `AI: ${message}`, sender: "ai" }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <header className="py-8 text-4xl font-bold text-center tracking-tight">
        AI Chatbot
      </header>
      <main className="flex-1 w-full max-w-2xl flex flex-col items-center">
        <div className="chat-window w-full bg-white text-black p-6 rounded-lg mb-6 shadow-lg max-h-[60vh] overflow-y-auto">
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
        <div className="input-area flex w-full gap-2 max-w-2xl">
          <input
            className="flex-1 bg-white text-black rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
            type="text"
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Chat message"
          />
          <button
            className="bg-white text-black rounded-full px-4 py-3 font-bold hover:bg-gray-200 transition-shadow"
            onClick={() => handleSend()}
            aria-label="Send message"
          >
            Send
          </button>
          <button
            className={`bg-white rounded-full p-3 ml-2 ${listening ? "animate-pulse bg-yellow-300" : ""}`}
            onClick={() => !listening && startListening()}
            aria-label="Start speech input"
          >
            <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <rect x="9" y="8" width="6" height="8" rx="3" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
