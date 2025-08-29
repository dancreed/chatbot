"use client";
export default function VoiceTextChat() {
  return (
    <div style={{ background: "black", minHeight: "100vh", padding: 40 }}>
      <input
        style={{ width: 300, height: 40, fontSize: 20, background: "lime", border: "2px solid red" }}
        placeholder="SHOULD BE VISIBLE"
      />
      <button>Send</button>
    </div>
  );
}