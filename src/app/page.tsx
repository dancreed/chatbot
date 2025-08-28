import VoiceChat from "@/app/components/VoiceChat";

export default function Page() {
  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">
            Dan's AI Voice Assistant
          </h1>
          <p className="text-sm text-gray-600">
            You can click start conversation and talk to my AI, it will reply with speech and text.
          </p>
        </header>
        <VoiceChat />
      </div>
    </main>
  );
}
