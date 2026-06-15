import { useEffect, useState, useRef } from "react";
import { searchProducts } from "../utils/api";
import { getProductEmoji, getCategoryTint } from "../utils/productImage";

export default function AutoSuggest({ query, quantities, onAdd, onClose }) {
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    const q = (query || "").trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await searchProducts(q, 6);
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 220);
    return () => clearTimeout(timer.current);
  }, [query]);

  if (results.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-30 glass-strong rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <p className="text-[11px] text-gray-400">Products matching "{query.trim()}"</p>
        <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto pb-1">
        {results.map((p) => {
          const qty = quantities[p.id] || 0;
          return (
            <div
              key={p.id}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/70 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCategoryTint(p)} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {getProductEmoji(p)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {p.brand} · ₹{p.price_inr}
                </p>
              </div>
              <button
                onClick={() => onAdd({ ...p, _score: p._score ?? 0.7 })}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all flex-shrink-0"
              >
                {qty > 0 ? `Added · ${qty}` : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
