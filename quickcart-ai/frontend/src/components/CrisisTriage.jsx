import { useState } from "react";
import api from "../utils/api";

export default function CrisisTriage({ triage, currentIntent, onResolved }) {
  const [resolved, setResolved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!triage || resolved) return null;

  const handleChoice = async (option) => {
    setBusy(true);
    const augmentedIntent = {
      ...currentIntent,
      product_categories: [
        ...(currentIntent.product_categories || []),
        ...(option.additional_categories || []),
      ],
      keywords: [...(currentIntent.keywords || []), ...(option.additional_keywords || [])],
    };
    try {
      const { data } = await api.post("/intent/refine", { intent: augmentedIntent });
      onResolved(data.intent, data.cart);
      setResolved(true);
    } catch (e) {
      alert("Could not refine cart.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-4 animate-slide-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-500 text-lg">🚨</span>
        <p className="text-sm font-semibold text-red-900">Quick question to help you faster</p>
      </div>
      <p className="text-sm text-red-800 mb-3">{triage.question}</p>
      <div className="flex flex-col gap-2">
        {triage.options.map((opt, i) => (
          <button
            key={i}
            disabled={busy}
            onClick={() => handleChoice(opt)}
            className="text-left text-sm bg-white hover:bg-red-100 border border-red-200 rounded-xl px-3 py-2.5 transition-colors disabled:opacity-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
