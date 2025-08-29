"use client";
import React, { useState, useRef } from "react";

type ChatMessage = {
  text: string;
  sender: "user" | "ai" | "system";
  audioB64?: string;
};

export default function VoiceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Connect to backend Durable Object WebSocket
  function connectWS() {
    wsRef.current = new WebSocket("wss://worker.dan-creed.workers.dev/websocket"); // <-- Replace with your endpoint!
    wsRef.current.onopen = () => {
      setConnected(true);
      setMessages((msgs) => [...msgs, { text: "Connected!", sender: "system" }]);
    };
    wsRef.current.onmessage = async (evt) => {
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

  // Microphone recording and sending audio chunks to backend WS
  async function startRecording() {
    if (!connected || !wsRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microphone not supported in this browser!");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data && wsRef.current?.readyState === WebSocket.OPEN) {
        const buffer = await e.data.arrayBuffer();
        wsRef.current.send(buffer);
      }
    };
    mediaRecorder.start(500); // Send every 500ms (tweak as desired)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
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
      <button
        onClick={startRecording}
        disabled={!connected || !!mediaRecorderRef.current}
        style={{
          marginBottom: "12px",
          marginLeft: "8px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: "orange",
          color: "#222",
          fontWeight: "bold",
          border: "none",
          cursor: !connected || !!mediaRecorderRef.current ? "default" : "pointer",
        }}
      >
        🎤 Start Recording
      </button>
      <button
        onClick={stopRecording}
        disabled={!mediaRecorderRef.current}
        style={{
          marginBottom: "12px",
          marginLeft: "8px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: "red",
          color: "#fff",
          fontWeight: "bold",
          border: "none",
          cursor: !mediaRecorderRef.current ? "default" : "pointer",
        }}
      >
        ⏹ Stop
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
    </div>
  );
}
