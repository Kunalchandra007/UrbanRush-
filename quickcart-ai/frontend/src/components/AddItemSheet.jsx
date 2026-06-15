import { useState, useEffect, useRef } from "react";
import { searchProducts } from "../utils/api";
import { getProductEmoji, getCategoryTint } from "../utils/productImage";

export default function AddItemSheet({ open, existingIds = [], onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const debounceRef = useRef(null);

  // Debounced catalog search
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchProducts(query, 10);
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  if (!open) return null;

  const addCustom = () => {
    const name = query.trim();
    const price = parseInt(customPrice, 10);
    if (!name || !price || price <= 0) return;
    onAdd({
      id: `CUSTOM-${Date.now()}`,
      name,
      brand: "Custom item",
      category: "general",
      tags: [],
      price_inr: price,
      rating: 4.0,
      in_stock: true,
      image_url: "https://placehold.co/80x80?text=%2B",
      _score: 0.5,
      _custom: true,
    });
    setQuery("");
    setCustomPrice("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl p-5 mx-auto animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-lg">Add your own item</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products — milk, chips, torch…"
            className="w-full h-12 rounded-2xl bg-white/80 border border-white/60 px-4 pr-10 text-sm
                       outline-none focus:border-blue-400 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        {/* Results */}
        <div className="mt-3 overflow-y-auto flex-1 space-y-2 pr-1">
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 bg-white/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          )}

          {!loading &&
            results
              .filter((p) => !existingIds.includes(p.id))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAdd({ ...p, _score: p._score ?? 0.6, _added: true })}
                  className="w-full flex items-center gap-3 bg-white/70 hover:bg-white rounded-2xl p-2.5
                             border border-white/60 hover:border-blue-300 transition-all text-left group"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getCategoryTint(p)} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {getProductEmoji(p)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.brand}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-700">₹{p.price_inr}</span>
                  <span className="text-blue-500 text-lg font-bold group-hover:scale-110 transition-transform">＋</span>
                </button>
              ))}

          {!loading && results.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No matches found in catalog.</p>
          )}
        </div>

        {/* Custom item — when nothing matches what they want */}
        {query.trim() && (
          <div className="mt-3 pt-3 border-t border-white/50">
            <p className="text-xs text-slate-500 mb-2">Not in our list? Add it as a custom item.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/80 rounded-2xl px-3 h-11 flex items-center text-sm text-slate-700 truncate border border-white/60">
                {query.trim()}
              </div>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="₹"
                className="w-20 h-11 rounded-2xl bg-white/80 border border-white/60 px-3 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={addCustom}
                className="h-11 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-40"
                disabled={!query.trim() || !customPrice}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
