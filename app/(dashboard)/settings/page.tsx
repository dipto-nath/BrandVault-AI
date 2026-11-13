export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-dark">Settings</h2>
        <p className="text-ink-secondary">Workspace configuration and AI provider.</p>
      </div>
      <div className="card">
        <h3 className="font-semibold text-ink-dark mb-4">AI provider</h3>
        <p className="text-ink-secondary text-sm">Configured provider: <span className="font-medium text-ink-dark">Google Gemini (server-side)</span></p>
        <p className="text-ink-secondary text-sm mt-2">The AI model is accessed only from server-side code. API keys are never exposed to the browser.</p>
      </div>
    </div>
  );
}
