import { useState } from "react";
import { getProductEmoji, getCategoryTint } from "../utils/productImage";

function Thumb({ item }) {
  return (
    <div className={`relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center bg-white ${getCategoryTint ? "" : ""}`}>
      <span className="absolute text-xl">{getProductEmoji(item)}</span>
      <img
        src={`/products/${item.id}.jpg`}
        alt={item.name}
        className="relative w-full h-full object-contain p-1 bg-white"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    </div>
  );
}

export default function KitCard({ label, items, intent, onEdit }) {
  const [explain, setExplain] = useState(false);
  const total = items.reduce((s, i) => s + i.price_inr, 0);
  const match = Math.round(
    (items.reduce((s, i) => s + (i._score || 0), 0) / Math.max(items.length, 1)) * 100
  );
  const why =
    items.find((i) => i._reason)?._reason ||
    `Picked for your ${(intent?.occasion || "situation").replace(/_/g, " ")}`;

  return (
    <div className="flex-shrink-0 w-72 glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-blue-700 text-sm uppercase tracking-wide truncate">{label}</h4>
        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
          ⭐ {match}% Match
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        {items.slice(0, 4).map((it) => (
          <Thumb key={it.id} item={it} />
        ))}
      </div>

      <p className="text-xs text-slate-600 mb-2 line-clamp-2">
        <span className="font-semibold text-slate-700">Why:</span> {why}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {items.length} item{items.length !== 1 ? "s" : ""} · ₹{total}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setExplain((e) => !e)}
            className="text-xs font-medium text-slate-600 bg-white/70 border border-gray-200 px-2.5 py-1 rounded-full hover:bg-white"
          >
            ⊙ Explain
          </button>
          <button
            onClick={onEdit}
            className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100"
          >
            ✎ Edit
          </button>
        </div>
      </div>

      {explain && (
        <div className="mt-2 pt-2 border-t border-white/50 space-y-1">
          {items.map((i) => (
            <p key={i.id} className="text-[11px] text-slate-500 leading-snug">
              • <span className="font-medium text-slate-700">{i.name.split(" ").slice(0, 3).join(" ")}</span>
              {" — "}
              {i._reason || "fits your situation"}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
