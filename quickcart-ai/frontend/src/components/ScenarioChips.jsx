import { useState, useEffect } from "react";
import { getScenarios } from "../utils/api";

const FALLBACK = [
  { icon: "🎉", label: "Guests in 30 mins", text: "I have guests coming in 30 minutes" },
  { icon: "🎬", label: "Movie night", text: "Movie night for 5 people" },
  { icon: "🤒", label: "Baby fever", text: "My baby has fever" },
  { icon: "📚", label: "Exam tomorrow", text: "Exam tomorrow morning" },
  { icon: "⚡", label: "Power cut", text: "Power cut at home" },
  { icon: "🍳", label: "Breakfast", text: "Breakfast for 4 people" },
  { icon: "🌧️", label: "Rain coming", text: "Rain is coming" },
  { icon: "🎊", label: "House party", text: "House party tonight" },
];

export default function ScenarioChips({ onSelect }) {
  const [scenarios, setScenarios] = useState(FALLBACK);

  useEffect(() => {
    getScenarios()
      .then(({ data }) => {
        if (data.scenarios?.length) {
          setScenarios(
            data.scenarios.map((s) => ({ icon: s.emoji, label: s.label || s.text, text: s.text }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {scenarios.map((s) => (
        <button
          key={s.text}
          onClick={() => onSelect(s.text)}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-2 text-sm font-medium
                     cursor-pointer transition-all hover:-translate-y-0.5 hover:text-blue-700
                     active:scale-95 text-slate-700"
        >
          <span className="text-base">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
