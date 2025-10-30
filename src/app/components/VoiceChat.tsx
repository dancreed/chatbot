"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { clientConfig } from "@/config";
import { ChatMessage, ConnectionStatus, VoiceChatState, createMessage } from "@/types";
import ErrorDisplay, { LoadingIndicator, StatusIndicator } from "./UIComponents";

export default function VoiceChat() {
  const [state, setState] = useState<VoiceChatState>({
    messages: [],
    connected: false,
    status: 'idle',
    error: null,
    isRecording: false
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioUrlsRef = useRef<string[]>([]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Clean up media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        const tracks = mediaRecorderRef.current.stream?.getTracks();
        tracks?.forEach((track: any) => track.stop());
      }
      
      // Clean up audio URLs
      audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const addMessage = useCallback((text: string, sender: ChatMessage['sender'], audioB64?: string) => {
    const message = createMessage(text, sender, audioB64);
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  }, []);

  const setStatus = useCallback((status: ConnectionStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Connect to backend Durable Object WebSocket
  function connectWS() {
    setState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    wsRef.current = new WebSocket(clientConfig.websocket.url);
    
    wsRef.current.onopen = () => {
      setState(prev => ({ ...prev, connected: true, status: 'connected' }));
      addMessage("Connected!", "system");
    };
    
    wsRef.current.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "text") {
          addMessage(msg.text, "user");
        } else if (msg.type === "audio") {
          addMessage(msg.text, "ai", msg.audio);
          playBase64Audio(msg.audio);
        } else if (msg.type === "status") {
          addMessage(msg.text, "system");
          setStatus(msg.text === 'Speaking…' ? 'speaking' : 'idle');
        }
      } catch (error) {
        setError(`Failed to parse WebSocket message: ${error}`);
      }
    };
    
    wsRef.current.onerror = () => {
      setError("WebSocket connection error");
      setState(prev => ({ ...prev, status: 'error' }));
    };
    
    wsRef.current.onclose = () => {
      setState(prev => ({ ...prev, connected: false, status: 'idle' }));
      addMessage("Connection closed.", "system");
    };
  }

  // Play audio from base64 with proper cleanup
  const playBase64Audio = useCallback((b64: string) => {
    try {
      const audioBlob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      audioUrlsRef.current.push(url);
      
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        const index = audioUrlsRef.current.indexOf(url);
        if (index > -1) {
          audioUrlsRef.current.splice(index, 1);
        }
      };
      audio.onerror = () => {
        setError("Failed to play audio");
        URL.revokeObjectURL(url);
      };
      
      audio.play().catch((error) => {
        setError(`Audio playback error: ${error.message}`);
      });
    } catch (error) {
      setError(`Failed to process audio: ${error}`);
    }
  }, [setError]);

  // Microphone recording and sending audio chunks to backend WS
  const startRecording = useCallback(async () => {
    if (!state.connected || !wsRef.current) {
      setError("Not connected to server");
      return;
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not supported in this browser!");
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isRecording: true, status: 'recording', error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data && wsRef.current?.readyState === WebSocket.OPEN) {
          const buffer = await e.data.arrayBuffer();
          wsRef.current.send(buffer);
        }
      };
      
      mediaRecorder.onerror = () => {
        setError("Recording error occurred");
        stopRecording();
      };
      
      mediaRecorder.start(500); // Send every 500ms
    } catch (error) {
      setError(`Failed to start recording: ${error}`);
      setState(prev => ({ ...prev, isRecording: false, status: 'connected' }));
    }
  }, [state.connected, setError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      // Clean up the media stream
      const tracks = mediaRecorderRef.current.stream?.getTracks();
      tracks?.forEach(track => track.stop());
      
      mediaRecorderRef.current = null;
    }
    setState(prev => ({ ...prev, isRecording: false, status: 'connected' }));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#222", padding: "40px" }}>
      <h1 style={{ color: "white", marginBottom: "24px" }}>AI Voice Chat Box</h1>
      
      {/* Error Display */}
      {state.error && (
        <div style={{
          backgroundColor: "#ff4444",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>Error: {state.error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Status Indicator */}
      <div style={{ color: "white", marginBottom: "16px" }}>
        Status: {state.status === 'connected' && '✅ Connected'}
        {state.status === 'connecting' && '🔄 Connecting...'}
        {state.status === 'recording' && '🎤 Recording...'}
        {state.status === 'processing' && '🧠 Processing...'}
        {state.status === 'speaking' && '🔊 Speaking...'}
        {state.status === 'error' && '❌ Error'}
        {state.status === 'idle' && '⚪ Idle'}
      </div>

      {/* Control Buttons */}
      <button
        onClick={connectWS}
        disabled={state.connected}
        style={{
          marginBottom: "12px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: state.connected ? "gray" : "limegreen",
          color: "#222",
          fontWeight: "bold",
          border: "none",
          cursor: state.connected ? "default" : "pointer",
        }}
      >
        {state.connected ? "Connected!" : "Connect"}
      </button>
      
      <button
        onClick={startRecording}
        disabled={!state.connected || state.isRecording}
        style={{
          marginBottom: "12px",
          marginLeft: "8px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: state.isRecording ? "gray" : "orange",
          color: "#222",
          fontWeight: "bold",
          border: "none",
          cursor: !state.connected || state.isRecording ? "default" : "pointer",
        }}
      >
        🎤 {state.isRecording ? "Recording..." : "Start Recording"}
      </button>
      
      <button
        onClick={stopRecording}
        disabled={!state.isRecording}
        style={{
          marginBottom: "12px",
          marginLeft: "8px",
          padding: "10px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          background: state.isRecording ? "red" : "gray",
          color: "#fff",
          fontWeight: "bold",
          border: "none",
          cursor: !state.isRecording ? "default" : "pointer",
        }}
      >
        ⏹ Stop
      </button>

      {/* Messages */}
      <div style={{ marginBottom: "24px" }}>
        {state.messages.map((msg) => (
          <div key={msg.id} style={{
            color: msg.sender === "ai" ? "deepskyblue" :
                   msg.sender === "user" ? "white" : "orange",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <div>
              <b>{msg.sender}</b>: {msg.text}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
