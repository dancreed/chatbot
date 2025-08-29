"use client";
import React, { useState, useRef } from "react";
// ... keep your SpeechRecognition interfaces

export default function VoiceTextChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "ai" }[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    recognition.onresult = (event) => {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="py-8 text-4xl font-bold text-center tracking-tight">
        AI Chatbot
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-end pt-4 pb-32">
        <div className="chat-window w-full bg-white text-black p-6 rounded-lg mb-6 shadow-lg max-h-[40vh] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`mb-4 ${m.sender === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block px-4 py-2 rounded-xl ${
                m.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
              }`}>
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
        className="w-full bg-white border-t-2 border-gray-300 fixed left-0 right-0 bottom-0 z-50 flex justify-center py-5"
      >
        <div className="flex w-full max-w-2xl gap-2 px-4">
          <input
            className="flex-1 bg-gray-50 text-gray-900 border border-gray-400 rounded-full px-6 py-3 text-lg"
            type="text"
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Chat message"
          />
          <button
            className="bg-blue-600 text-white font-bold rounded-full px-7 py-3 text-lg"
            onClick={() => handleSend()}
            aria-label="Send message"
          >
            Send
          </button>
          <button
            className={`rounded-full border-2 ml-2 w-12 h-12 flex items-center justify-center ${
              listening ? "bg-orange-400 border-orange-600" : "bg-gray-200 border-blue-600"
            }`}
            onClick={() => !listening && startListening()}
            aria-label="Start speech input"
          >
            <svg width="24" height="24" fill="none" stroke={listening ? "white" : "black"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <rect x="9" y="8" width="6" height="8" rx="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
