export default function Page() {
  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{`Dan's AI Voice & Text Assistant`}</h1>
          <p className="text-sm text-gray-600">
            Type your message or use the mic button to start talking!
          </p>
        </header>
        <VoiceTextChat />
      </div>
    </main>
  );
}
