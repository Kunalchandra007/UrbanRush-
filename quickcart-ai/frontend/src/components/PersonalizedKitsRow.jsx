import { useMemo } from "react";
import { getPurchases, getUserName } from "../utils/personalization";

// Group purchases into themed kits based on category
const KIT_THEMES = [
  {
    key: "morning",
    label: "MORNING ESSENTIALS KIT",
    categories: ["dairy", "bakery", "beverages"],
    tagMatch: ["breakfast", "milk", "bread", "tea", "coffee"],
    why: "Your morning routine, restocked automatically.",
  },
  {
    key: "snack",
    label: "SNACK TIME KIT",
    categories: ["snacks", "bakery"],
    tagMatch: ["snacks", "chips", "biscuits", "movie_night"],
    why: "Your go-to snacks based on past orders.",
  },
  {
    key: "drinks",
    label: "DRINKS KIT",
    categories: ["beverages"],
    tagMatch: ["drinks", "soda", "juice", "energy"],
    why: "Drinks you reach for most often.",
  },
  {
    key: "care",
    label: "PERSONAL CARE KIT",
    categories: ["personal_care", "emergency", "cleaning"],
    tagMatch: ["hygiene", "soap", "medicine", "health"],
    why: "Household must-haves you always keep stocked.",
  },
  {
    key: "kitchen",
    label: "KITCHEN STAPLES KIT",
    categories: ["kitchen"],
    tagMatch: ["cooking", "kitchen", "spices"],
    why: "Pantry staples you order regularly.",
  },
];

function Thumb({ item }) {
  return (
    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center flex-shrink-0">
      <img
        src={`/products/${item.id}.jpg`}
        alt={item.name}
        className="w-full h-full object-contain p-1"
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
      <span
        className="hidden absolute inset-0 items-center justify-center text-2xl bg-gradient-to-br from-blue-50 to-sky-100"
        aria-hidden="true"
      >
        {getCategoryEmoji(item.category)}
      </span>
    </div>
  );
}

function getCategoryEmoji(category) {
  const map = {
    snacks: "🍿", beverages: "🥤", dairy: "🥛", bakery: "🍞",
    baby: "👶", emergency: "⚡", personal_care: "🧴", stationery: "📚",
    cleaning: "🧹", kitchen: "🍳", electronics: "🔌",
  };
  return map[category] || "🛒";
}

export default function PersonalizedKitsRow({ quantities, onAdd }) {
  const userName = getUserName();
  const purchases = getPurchases();

  // Build kit buckets from purchase history
  const kits = useMemo(() => {
    const entries = Object.entries(purchases);
    if (entries.length === 0) return [];

    // Sort by purchase count desc
    const sorted = entries
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, e]) => ({ id, ...e }));

    const result = [];

    for (const theme of KIT_THEMES) {
      const items = sorted.filter(
        (item) =>
          theme.categories.includes(item.category) ||
          theme.tagMatch.some((tag) => (item.name || "").toLowerCase().includes(tag))
      );

      if (items.length >= 2) {
        const kitItems = items.slice(0, 4);
        const total = kitItems.reduce((s, i) => s + (i.price || 0), 0);
        result.push({ ...theme, items: kitItems, total });
      }
    }

    return result.slice(0, 4); // max 4 kits
  }, [purchases]);

  if (kits.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-blue-500 text-lg">✦</span>
        <div>
          <h2 className="text-base font-extrabold text-slate-800 leading-tight">
            Suggestions for {userName}
          </h2>
          <p className="text-xs text-slate-400">Based on your order history</p>
        </div>
      </div>

      {/* Horizontal scrollable kit cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {kits.map((kit) => (
          <KitCard key={kit.key} kit={kit} quantities={quantities} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

function KitCard({ kit, quantities, onAdd }) {
  const addedCount = kit.items.filter((i) => (quantities[i.id] || 0) > 0).length;
  const allAdded = addedCount === kit.items.length;

  return (
    <div className="flex-shrink-0 w-72 glass rounded-2xl p-4 hover:shadow-lg transition-all">
      {/* Kit title */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-blue-700 text-xs uppercase tracking-wide truncate flex-1">
          {kit.label}
        </h4>
        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
          ⭐ Your fav
        </span>
      </div>

      {/* Product thumbnails */}
      <div className="flex gap-2 mb-3">
        {kit.items.map((item) => (
          <Thumb key={item.id} item={item} />
        ))}
      </div>

      {/* Item names (short) */}
      <div className="flex flex-wrap gap-1 mb-2">
        {kit.items.map((item) => (
          <span
            key={item.id}
            className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full truncate max-w-[6rem]"
          >
            {item.name.split(" ").slice(0, 2).join(" ")}
          </span>
        ))}
      </div>

      {/* Why */}
      <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">
        <span className="font-semibold text-slate-600">Why:</span> {kit.why}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {kit.items.length} items · ₹{kit.total}
        </span>
        <button
          onClick={() => {
            kit.items.forEach((item) =>
              onAdd({
                id: item.id,
                name: item.name,
                category: item.category,
                price_inr: item.price,
                image_url: item.image_url || "",
                _score: 0.9,
                _reason: "Your usual order",
              })
            );
          }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            allAdded
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/30"
          }`}
        >
          {allAdded ? "✓ Added" : "Add all"}
        </button>
      </div>
    </div>
  );
}
