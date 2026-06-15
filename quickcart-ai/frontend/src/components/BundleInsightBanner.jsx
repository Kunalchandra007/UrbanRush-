export default function BundleInsightBanner({ insights, gapsFilled }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="mx-4 mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3 animate-slide-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-purple-700 text-sm font-semibold">
          ✦ Smart Bundle — {gapsFilled} item{gapsFilled !== 1 ? "s" : ""} added
        </span>
      </div>
      <div className="space-y-1">
        {insights.map((insight, i) => (
          <p key={i} className="text-xs text-purple-700 leading-relaxed">
            • {insight.message}
          </p>
        ))}
      </div>
    </div>
  );
}
