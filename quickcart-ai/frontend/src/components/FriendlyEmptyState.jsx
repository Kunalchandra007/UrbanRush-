const MESSAGES = [
  { emoji: "🤔", text: "Hmm, nothing matched that exactly — try describing it differently?" },
  { emoji: "🔍", text: "I looked everywhere but came up short. What else can I help with?" },
  { emoji: "✨", text: "Let's try that again — maybe with a bit more detail?" },
];

export default function FriendlyEmptyState({ onRetry }) {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return (
    <div className="glass rounded-3xl flex flex-col items-center text-center py-12 px-6">
      <div className="text-4xl mb-3">{msg.emoji}</div>
      <p className="text-slate-500 text-sm max-w-xs">{msg.text}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-xs text-blue-500 font-medium hover:text-blue-600">
          Try a scenario chip instead
        </button>
      )}
    </div>
  );
}
