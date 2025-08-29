"use client";
import React, { useState, useRef } from "react";

// Message type definition
type ChatMessage = {
  text: string;
  sender: "user" | "ai" | "system";
  audioB64?: string;
};

export default function VoiceChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  function connectWS() {
    // Use your actual deployed Durable Object WebSocket endpoint:
    wsRef.current = new WebSocket("wss://worker.dan-creed.workers.dev/websocket");
    wsRef.current.onopen = () => {
      setConnected(true);
      setMessages((msgs) => [...msgs, { text: "Connected!", sender: "system" }]);
    };
    wsRef.current.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "text") {
        setMessages((msgs) => [...msgs, { text: msg.text, sender: "user" }]);
      } else if (msg.type === "audio") {
        setMessages((msgs) => [
          ...msgs,
          { text: msg.text, sender: "ai", audioB64: msg.audio }
        ]);
        playBase64Audio(msg.audio);
      } else if (msg.type === "status") {
        setMessages((msgs) => [...msgs, { text: msg.text, sender: "system" }]);
      }
    };
    wsRef.current.onclose = () => {
      setConnected(false);
      setMessages((msgs) => [...msgs, { text: "Connection closed.", sender: "system" }]);
    };
  }

  // Play audio from base64
  function playBase64Audio(b64: string) {
    const audioBlob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'audio/wav' });
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.play();
  }

  // Example: send user text instead of audio for demo
  function handleSend() {
    if (!input.trim() || !connected || !wsRef.current) return;
    setMessages((msgs) => [...msgs, { text: input, sender: "user" }]);
    // Simulate sending text; for voice, you would stream ArrayBuffer of mic audio here
    wsRef.current.send(input);
    setInput("");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#222", padding: "40px" }}>
      <h1 style={{ color: "white", marginBottom: "24px" }}>AI Voice Chat Box</h1>
      <button
        onClick={connectWS}
        disabled={connected}
        style={{
          marginBottom: "12px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: connected ? "gray" : "limegreen",
          color: "#222",
          fontWeight: "bold",
          border: "none",
          cursor: connected ? "default" : "pointer",
        }}
      >
        {connected ? "Connected!" : "Connect"}
      </button>
      <div style={{ marginBottom: "24px" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            color: msg.sender === "ai" ? "deepskyblue" :
                   msg.sender === "user" ? "white" : "orange",
            marginBottom: "8px"
          }}>
            <b>{msg.sender}</b>: {msg.text}
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
          placeholder="Type your message (replace with audio stream for voice
