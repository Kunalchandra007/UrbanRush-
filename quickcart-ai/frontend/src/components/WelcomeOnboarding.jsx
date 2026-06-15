import { useState } from "react";
import { saveProfile } from "../utils/api";
import { setUserName } from "../utils/personalization";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "no nuts", label: "Nut allergy", emoji: "🥜" },
  { id: "none", label: "No restrictions", emoji: "✨" },
];

export default function WelcomeOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [dietary, setDietary] = useState([]);

  const toggle = (id) => {
    if (id === "none") return setDietary([]);
    setDietary((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const finish = async () => {
    const finalName = name.trim() || "there";
    setUserName(finalName);
    try {
      await saveProfile({ name: finalName, dietary });
    } catch (e) {
      /* offline ok */
    }
    localStorage.setItem("qc_onboarded", "true");
    onComplete({ name: finalName, dietary });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <div className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        {step === 0 && (
          <div>
            <div className="text-5xl mb-3">👋</div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">What should we call you?</h2>
            <p className="text-sm text-slate-500 mb-5">So the app feels a little more like yours.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setStep(1)}
              placeholder="Your name"
              className="w-full bg-white/80 border-2 border-white/60 focus:border-blue-400 rounded-2xl px-4 py-3 text-base outline-none transition-all mb-4"
            />
            <button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-semibold py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/30"
            >
              Continue
            </button>
            <button onClick={finish} className="w-full text-slate-400 text-sm mt-3 hover:text-slate-600">
              Skip for now
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="text-5xl mb-3">🍽️</div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">
              Any food preferences, {name.trim() || "friend"}?
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              We'll quietly filter your cart — no need to tell us every time.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DIETARY_OPTIONS.map((opt) => {
                const active = (opt.id === "none" && dietary.length === 0) || dietary.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                      active ? "border-blue-400 bg-blue-50 text-blue-700" : "border-white/60 bg-white/60 text-slate-600 hover:border-blue-200"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={finish}
              className="w-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-semibold py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/30"
            >
              Let's go →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
