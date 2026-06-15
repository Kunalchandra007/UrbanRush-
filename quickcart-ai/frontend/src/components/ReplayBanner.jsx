export default function ReplayBanner({ suggestion, onAccept, onDismiss }) {
  if (!suggestion) return null;

  return (
    <div className="mb-3 bg-indigo-50/80 backdrop-blur-sm border border-indigo-200 rounded-2xl px-4 py-3 flex items-start gap-3 animate-slide-in">
      <span className="text-indigo-400 text-lg">🔁</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-indigo-900 font-medium">{suggestion.message}</p>
        <p className="text-xs text-indigo-600 mt-1">
          {suggestion.item_names.slice(0, 3).join(", ")}
          {suggestion.item_names.length > 3 && ` +${suggestion.item_names.length - 3} more`}
          {" · "}₹{suggestion.total_inr}
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={onAccept}
            className="text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-full transition-colors"
          >
            Reorder the same →
          </button>
          <button onClick={onDismiss} className="text-xs text-indigo-400 hover:text-indigo-600">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
