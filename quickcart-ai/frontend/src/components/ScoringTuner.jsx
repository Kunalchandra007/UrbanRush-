import { useState } from "react";

export default function ScoringTuner({ open, onToggle, onWeightsChange }) {
  const [weights, setWeights] = useState({
    intent: 50,
    budget: 30,
    availability: 10,
    rating: 10,
  });

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleChange = (key, val) => {
    const newW = { ...weights, [key]: Number(val) };
    setWeights(newW);
    onWeightsChange({
      intent: newW.intent / 100,
      budget: newW.budget / 100,
      availability: newW.availability / 100,
      rating: newW.rating / 100,
    });
  };

  const sliders = [
    { key: "intent", label: "Intent Match" },
    { key: "budget", label: "Budget Fit" },
    { key: "availability", label: "Availability" },
    { key: "rating", label: "Rating" },
  ];

  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">ƒ</span>
        Live scoring formula
        <span className="text-gray-300">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Adjust AI scoring weights</p>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                total === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {total === 100 ? "" : "⚠ "}Total: {total}%
            </span>
          </div>

          {sliders.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 mb-2.5">
              <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 accent-blue-500"
              />
              <span className="text-xs font-mono text-gray-700 w-9 text-right">{weights[key]}%</span>
            </div>
          ))}

          <p className="text-xs text-gray-400 mt-2">Drag sliders → cart re-ranks live</p>
        </div>
      )}
    </div>
  );
}
