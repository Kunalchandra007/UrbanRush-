import { useState, useEffect } from "react";
import { searchProducts } from "../utils/api";
import ProductCard from "./ProductCard";

const CATEGORY_TABS = [
  { key: "all", label: "✨ All" },
  { key: "snacks", label: "🍿 Snacks" },
  { key: "beverages", label: "🥤 Drinks" },
  { key: "dairy", label: "🥛 Dairy" },
  { key: "bakery", label: "🍞 Bakery" },
  { key: "emergency", label: "⚡ Emergency" },
  { key: "baby", label: "👶 Baby Care" },
  { key: "stationery", label: "📚 Stationery" },
  { key: "personal_care", label: "🧴 Personal Care" },
  { key: "kitchen", label: "🍳 Kitchen" },
  { key: "cleaning", label: "🧹 Cleaning" },
];

export default function BrowsableHomeFeed({ quantities, usualIds, onAdd, onRemove }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    searchProducts("", 100)
      .then(({ data }) => setProducts(data.results || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === "all" ? products : products.filter((p) => p.category === activeTab);

  return (
    <div>
      {/* Compact headline */}
      <div className="px-1 mb-4">
        <h2 className="text-lg font-extrabold text-slate-800 leading-tight">
          Browse &amp; add items manually
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Or describe your situation on the left — AI builds the cart instantly.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-white/70 text-slate-600 border border-white/60 hover:border-blue-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3 px-1">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {activeTab !== "all"
            ? ` in ${CATEGORY_TABS.find((t) => t.key === activeTab)?.label}`
            : ""}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white/80 rounded-2xl border border-white/60 overflow-hidden animate-pulse"
              >
                <div className="h-28 bg-gradient-to-br from-gray-100 to-blue-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                  <div className="flex justify-between mt-3">
                    <div className="h-4 bg-gray-200 rounded w-8" />
                    <div className="h-7 bg-green-200 rounded-xl w-14" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Product grid */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              item={{ ...product, _score: 0.7 }}
              intent={null}
              quantity={quantities[product.id] || 0}
              usual={usualIds?.has(product.id)}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 md:col-span-3 text-center py-12 text-gray-400 text-sm">
              No products in this category
            </div>
          )}
        </div>
      )}
    </div>
  );
}
