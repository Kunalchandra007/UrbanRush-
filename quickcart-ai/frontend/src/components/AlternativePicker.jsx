import { useEffect, useState } from "react";
import { getAlternatives } from "../utils/api";

export default function AlternativePicker({ removedItem, cartItems, intent, onSwap, onDismiss }) {
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const excludeIds = cartItems.map((i) => i.id).join(",");
    getAlternatives({
      product_id: removedItem.id,
      occasion: intent?.occasion || "general",
      category: removedItem.category || "",
      budget: intent?.budget_inr || null,
      exclude: excludeIds,
    })
      .then(({ data }) => setAlts(data.alternatives || []))
      .catch(() => setAlts([]))
      .finally(() => setLoading(false));
  }, [removedItem.id]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 animate-slide-in">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-semibold text-blue-700">
          Replace "{removedItem.name.split(" ")[0]}" with?
        </p>
        <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600">
          Skip ✕
        </button>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-20 bg-blue-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          {alts.map((alt) => (
            <button
              key={alt.id}
              onClick={() => onSwap(alt)}
              className="flex-1 bg-white border border-blue-200 rounded-xl p-2
                         hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <img
                src={alt.image_url}
                alt={alt.name}
                className="w-12 h-12 object-cover rounded-lg mx-auto mb-1.5"
                onError={(e) => {
                  e.target.src = "https://placehold.co/80x80?text=Item";
                }}
              />
              <p className="text-xs font-medium text-center line-clamp-2 leading-tight text-slate-700">
                {alt.name.split(" ").slice(0, 4).join(" ")}
              </p>
              <p className="text-xs text-blue-600 font-bold text-center mt-1">₹{alt.price_inr}</p>
              {alt._sub_reason && (
                <p className="text-[10px] text-slate-400 text-center mt-0.5 line-clamp-1">{alt._sub_reason}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
