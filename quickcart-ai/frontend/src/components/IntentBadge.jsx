const OCCASION_ICONS = {
  party: "🎉", movie_night: "🎬", emergency: "🚨", breakfast: "🍳",
  baby_care: "👶", rain: "🌧️", power_cut: "⚡", exam: "📚",
  travel: "🧳", general: "🛒", comfort: "🫂", cooking: "🍳", recharge: "⚡",
};

export default function IntentBadge({ intent, confidence, confidenceLabel }) {
  if (!intent) return null;

  return (
    <div className="mb-4 glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{OCCASION_ICONS[intent.occasion] || "🛒"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight capitalize">
            {intent.situation || intent.occasion?.replace(/_/g, " ")}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {intent.occasion?.replace(/_/g, " ")}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                intent.urgency === "high"
                  ? "bg-red-100 text-red-700"
                  : intent.urgency === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {intent.urgency === "high" ? "🔴" : intent.urgency === "medium" ? "🟡" : "🟢"}{" "}
              {intent.urgency} urgency
            </span>
            {intent.people_count > 1 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                👥 {intent.people_count} people
              </span>
            )}
            {intent.budget_inr && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                ₹{intent.budget_inr} budget
              </span>
            )}
          </div>
        </div>
      </div>

      {confidence != null && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  confidence >= 85
                    ? "bg-green-500"
                    : confidence >= 70
                    ? "bg-blue-500"
                    : confidence >= 55
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {confidence}% — {confidenceLabel}
            </span>
          </div>
          {confidence < 70 && (
            <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-1.5 mt-2">
              💡 Try adding detail — "guests in 30 mins" or "baby has fever"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
