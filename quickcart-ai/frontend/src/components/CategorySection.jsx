import ProductCard from "./ProductCard";

export default function CategorySection({ label, items, intent, quantities, budget, previousCartIds = [], usualIds, onAdd, onRemove, onSwitch, excludeIds = [] }) {
  return (
    <div className="mb-6">
      {/* Section header — Blinkit style */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="font-bold text-sm text-slate-700">{label}</h3>
        <span className="text-xs text-gray-400 bg-white/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-200">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 [&>*]:transition-all [&>*]:duration-500">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            intent={intent}
            quantity={quantities[item.id] || 0}
            dimmed={budget != null && item.price_inr > budget}
            isNew={previousCartIds.length > 0 && !previousCartIds.includes(item.id)}
            usual={usualIds?.has(item.id)}
            onAdd={onAdd}
            onRemove={onRemove}
            onSwitch={onSwitch}
            excludeIds={excludeIds}
          />
        ))}
      </div>
    </div>
  );
}
