import { getProductEmoji, getCategoryTint } from "../utils/productImage";

export default function ReviewCart({ open, allItems, quantities, onAdd, onRemove, onCheckout, onClose }) {
  const cartItems = allItems.filter((i) => (quantities[i.id] || 0) > 0);
  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.price_inr * (quantities[i.id] || 0), 0);

  if (!open) return null;

  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel — Instamart "Review Items" style, anchored top-right */}
      <div className="fixed z-50 top-[68px] right-3 sm:right-[max(0.75rem,calc((100vw-72rem)/2+0.75rem))] w-[360px] max-w-[92vw] glass-strong rounded-3xl shadow-2xl overflow-hidden animate-slide-in flex flex-col max-h-[72vh]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg">Review Items</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/70 text-slate-500 hover:text-slate-800 flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Delivery row */}
        <div className="mx-3 mb-2 bg-white/70 rounded-2xl px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Delivery in</p>
            <p className="text-sm font-bold text-slate-800">10 mins</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            ⚡ Superfast
          </span>
          <span className="text-xs text-gray-400">{totalQty} items</span>
        </div>

        {/* Items list */}
        <div className="px-3 overflow-y-auto flex-1 space-y-1">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/50 last:border-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryTint(item)} flex items-center justify-center text-xl flex-shrink-0`}>
                {getProductEmoji(item)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight">{item.name}</p>
                <p className="text-xs text-gray-400">{item.brand}</p>
              </div>

              {/* Stepper */}
              <div className="flex items-center bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg overflow-hidden flex-shrink-0">
                <button onClick={() => onRemove(item)} className="text-white font-bold px-2 py-1 text-sm hover:bg-white/10">−</button>
                <span className="text-white font-bold text-sm px-1.5 min-w-[18px] text-center">{quantities[item.id]}</span>
                <button onClick={() => onAdd(item)} className="text-white font-bold px-2 py-1 text-sm hover:bg-white/10">+</button>
              </div>

              <span className="text-sm font-bold text-slate-800 w-12 text-right flex-shrink-0">
                ₹{item.price_inr * quantities[item.id]}
              </span>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="p-3">
          <button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all"
          >
            <span className="text-sm font-bold">{totalQty} items · ₹{totalPrice.toFixed(0)}</span>
            <span className="text-sm font-bold">Place Order →</span>
          </button>
        </div>
      </div>
    </>
  );
}
