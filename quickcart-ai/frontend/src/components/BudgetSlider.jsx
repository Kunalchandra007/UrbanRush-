export default function BudgetSlider({ budget, onChange }) {
  return (
    <div className="mx-4 mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-600">Budget filter</span>
        <span className="text-sm font-bold text-blue-600">
          ₹{budget.toLocaleString("en-IN")}
        </span>
      </div>
      <input
        type="range"
        min={100}
        max={2000}
        step={50}
        value={budget}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>₹100</span>
        <span>₹500</span>
        <span>₹1,000</span>
        <span>₹2,000</span>
      </div>
    </div>
  );
}
