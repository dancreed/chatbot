"use client";
import React, { useState } from "react";

export default function VoiceTextChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, input]);
    setInput("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#222", padding: "40px" }}>
      <h1 style={{ color: "white", marginBottom: "24px" }}>Simple Chat Box</h1>
      <div style={{ marginBottom: "24px" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ color: "white", marginBottom: "8px" }}>
            {msg}
          </div>
        ))}
      </div>
      <div style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#333",
        padding: "24px",
        borderTop: "3px solid #666",
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        zIndex: 9999,
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            width: "40%",
            padding: "12px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "2px solid #aaa",
            marginRight: "12px",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "12px 32px",
            fontSize: "18px",
            borderRadius: "8px",
            background: "limegreen",
            color: "#222",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
