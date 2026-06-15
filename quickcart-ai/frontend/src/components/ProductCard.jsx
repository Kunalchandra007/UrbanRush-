import { useState } from "react";
import { getUrgencyLevel, URGENCY_CONFIG } from "../utils/urgencyColor";
import { getProductEmoji, getCategoryTint } from "../utils/productImage";
import { getAlternatives } from "../utils/api";

export default function ProductCard({ item, intent, onAdd, onRemove, quantity = 0, dimmed = false, isNew = false, usual = false, onSwitch, excludeIds = [] }) {
  const level = getUrgencyLevel(item, intent);
  const config = URGENCY_CONFIG[level];
  const matchPct = Math.round((item._score || 0) * 100);
  const emoji = getProductEmoji(item);
  const tint = getCategoryTint(item);

  // Image fallback chain: local downloaded file → online photo → emoji tile
  const candidates = [];
  if (item.id && !item._custom) candidates.push(`/products/${item.id}.jpg`);
  if (item.image_url) candidates.push(item.image_url);
  const [imgStage, setImgStage] = useState(0);
  const imgSrc = candidates[imgStage];

  // Switch-alternatives popover
  const canSwitch = onSwitch && item.id && !item._custom;
  const [switchOpen, setSwitchOpen] = useState(false);
  const [alts, setAlts] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const openSwitch = async () => {
    setSwitchOpen(true);
    setLoadingAlts(true);
    try {
      const { data } = await getAlternatives({
        product_id: item.id,
        occasion: intent?.occasion,
        category: item.category,
        exclude: excludeIds.join(","),
      });
      setAlts(data.alternatives || []);
    } catch {
      setAlts([]);
    } finally {
      setLoadingAlts(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl
                  border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5
                  hover:border-blue-200 transition-all duration-300 overflow-hidden
                  ${config.border} ${dimmed ? "opacity-40 grayscale" : ""}
                  ${isNew ? "ring-2 ring-green-400" : ""}`}
    >
      {/* Diff: newly added by re-rank */}
      {isNew && (
        <span className="absolute top-2 right-2 z-20 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full animate-pulse">
          NEW
        </span>
      )}

      {/* Urgency badge — top left */}
      <span
        className={`absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded-full
                    font-semibold flex items-center gap-1 ${config.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>

      {/* Bundle / swapped / added badge — top right */}
      {item._injected && (
        <span className="absolute top-2 right-2 z-10 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">
          ✦ Bundle
        </span>
      )}
      {item._swapped && (
        <span className="absolute top-2 right-2 z-10 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
          ⇄ Swapped
        </span>
      )}
      {(item._added || item._custom) && (
        <span className="absolute top-2 right-2 z-10 text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-semibold">
          ＋ Yours
        </span>
      )}

      {/* Product image: local file → online photo → emoji tile */}
      <div className={`relative w-full h-28 flex items-center justify-center overflow-hidden ${imgSrc ? "bg-white" : `bg-gradient-to-br ${tint}`}`}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-contain p-2"
            onError={() => setImgStage((s) => s + 1)}
          />
        ) : (
          <span className="text-5xl drop-shadow-sm select-none">{emoji}</span>
        )}
        {canSwitch && (
          <button
            onClick={openSwitch}
            title="Switch to an alternative"
            className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-white/90 backdrop-blur text-blue-700 text-[10px] font-semibold px-2 py-1 rounded-full shadow hover:bg-blue-50 transition-all"
          >
            ⇄ Switch
          </button>
        )}
      </div>

      {/* Switch-alternatives popover */}
      {switchOpen && (
        <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 flex flex-col animate-slide-in">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-slate-700">Switch "{item.name.split(" ")[0]}" →</p>
            <button onClick={() => setSwitchOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
            {loadingAlts && [0, 1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            {!loadingAlts && alts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No alternatives found.</p>
            )}
            {!loadingAlts &&
              alts.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => {
                    onSwitch(item, alt);
                    setSwitchOpen(false);
                  }}
                  className="w-full flex items-center gap-2 bg-white border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-lg p-1.5 text-left transition-all"
                >
                  <img
                    src={`/products/${alt.id}.jpg`}
                    alt={alt.name}
                    className="w-8 h-8 rounded object-contain bg-gray-50 flex-shrink-0"
                    onError={(e) => { e.target.style.visibility = "hidden"; }}
                  />
                  <span className="flex-1 min-w-0 text-xs font-medium text-slate-700 truncate">{alt.name}</span>
                  <span className="text-xs font-bold text-slate-800">₹{alt.price_inr}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col gap-1 p-2.5 flex-1">
        <p className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight min-h-[2.25rem]">
          {item.name}
        </p>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 truncate">{item.brand}</span>
          <span className="text-xs text-yellow-500 whitespace-nowrap">★ {item.rating}</span>
        </div>

        {usual && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
            ⭐ Your usual
          </span>
        )}

        {item._reason && (
          <p className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full line-clamp-1 mt-0.5">
            ✦ {item._reason}
          </p>
        )}

        {/* Match bar */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${matchPct}%` }} />
          </div>
          <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">{matchPct}%</span>
        </div>

        {/* Price + Add / stepper */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-extrabold text-slate-800 text-sm">₹{item.price_inr}</span>

          {quantity === 0 ? (
            <button
              onClick={() => onAdd(item)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600
                         text-white text-xs font-bold px-3.5 py-1.5 rounded-xl active:scale-95 transition-all
                         shadow-sm shadow-green-500/30"
            >
              + Add
            </button>
          ) : (
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-sky-600 rounded-xl overflow-hidden shadow-sm shadow-blue-500/30">
              <button
                onClick={() => onRemove(item)}
                className="text-white font-bold px-2.5 py-1.5 text-sm hover:bg-white/10 transition-colors"
              >
                −
              </button>
              <span className="text-white font-bold text-sm px-1.5 min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => onAdd(item)}
                className="text-white font-bold px-2.5 py-1.5 text-sm hover:bg-white/10 transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
