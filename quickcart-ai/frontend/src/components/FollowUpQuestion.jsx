import { useState } from "react";
import api from "../utils/api";

export default function FollowUpQuestion({ followup, currentIntent, onResolved, onDismiss }) {
  const [busy, setBusy] = useState(false);
  if (!followup) return null;

  const choose = async (option) => {
    setBusy(true);
    const patch = option.patch || {};
    const merged = {
      ...currentIntent,
      ...(patch.people_count ? { people_count: patch.people_count } : {}),
      product_categories: [
        ...(currentIntent.product_categories || []),
        ...(patch.product_categories || []),
      ],
      keywords: [...(currentIntent.keywords || []), ...(patch.keywords || [])],
    };
    try {
      const { data } = await api.post("/intent/refine", { intent: merged });
      onResolved(data.intent, data.cart);
    } catch {
      onDismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3 bg-violet-50/80 backdrop-blur-sm border border-violet-200 rounded-2xl px-4 py-3 animate-slide-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-violet-900">💬 {followup.question}</p>
        <button onClick={onDismiss} className="text-xs text-violet-400 hover:text-violet-600">
          skip
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {followup.options.map((opt, i) => (
          <button
            key={i}
            disabled={busy}
            onClick={() => choose(opt)}
            className="text-sm bg-white border-2 border-violet-300 text-violet-700 rounded-full px-3 py-1.5
                       font-medium hover:bg-violet-500 hover:text-white active:scale-95 transition-all disabled:opacity-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
