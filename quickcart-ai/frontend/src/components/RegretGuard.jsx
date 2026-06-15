import { useState, useEffect, useRef } from "react";

// Shows a 10s safety-net confirm for "risky" items (high quantity) before ordering.
export default function RegretGuard({ open, items, quantities, onConfirm, onCancel, onAdjust }) {
  const [secs, setSecs] = useState(10);
  const timer = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSecs(10);
    timer.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          onConfirm();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🛟</span>
          <h3 className="font-bold text-slate-800 text-lg">Quick check before we go</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          You're moving fast — just confirming these quantities are right:
        </p>

        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-700 truncate">{it.name}</span>
              <div className="flex items-center bg-blue-600 rounded-lg overflow-hidden flex-shrink-0">
                <button onClick={() => onAdjust(it, -1)} className="text-white px-2 py-1 text-sm hover:bg-white/10">−</button>
                <span className="text-white font-bold text-sm px-2">{quantities[it.id]}</span>
                <button onClick={() => onAdjust(it, +1)} className="text-white px-2 py-1 text-sm hover:bg-white/10">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-white/70 text-slate-700 font-semibold text-sm hover:bg-white">
            Let me fix it
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm">
            Looks good — order ({secs}s)
          </button>
        </div>
      </div>
    </div>
  );
}
