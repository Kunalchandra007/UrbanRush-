import { useState, useRef } from "react";
import { parseItems } from "../utils/api";
import { getProductEmoji, getCategoryTint } from "../utils/productImage";

// Group cart by voice: each person speaks, AI extracts items, dedupes into one cart.
export default function PartyMode({ open, onClose, onAdd, quantities }) {
  const [listening, setListening] = useState(false);
  const [log, setLog] = useState([]); // [{speaker, text, items:[...]}]
  const recRef = useRef(null);
  const speakerRef = useRef(1);

  if (!open) return null;

  const listen = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported — use Chrome or Edge.");
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      try {
        const { data } = await parseItems(text);
        const items = data.items || [];
        items.forEach((it) => onAdd(it));
        setLog((prev) => [...prev, { speaker: speakerRef.current, text, items }]);
        speakerRef.current += 1;
      } catch {
        setLog((prev) => [...prev, { speaker: speakerRef.current, text, items: [] }]);
      }
    };
    rec.start();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="glass-strong rounded-3xl p-5 max-w-md w-full shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800 text-lg">🎉 Party Mode</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/70 text-slate-500 hover:text-slate-800 flex items-center justify-center">✕</button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Pass the phone around — everyone says what they want. One mic, one shared cart.
        </p>

        <button
          onClick={listen}
          className={`w-full py-3 rounded-2xl font-bold text-white mb-3 transition-all ${
            listening ? "bg-red-500 pulse-ring" : "bg-gradient-to-r from-blue-500 to-sky-500"
          }`}
        >
          {listening ? "🎙 Listening… tap to stop" : `🎙 Person ${speakerRef.current} — tap & speak`}
        </button>

        <div className="overflow-y-auto flex-1 space-y-2">
          {log.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">
              e.g. "get me chips and a coke" — items get added automatically.
            </p>
          )}
          {log.map((entry, i) => (
            <div key={i} className="bg-white/70 rounded-2xl p-3">
              <p className="text-xs font-semibold text-blue-600">Person {entry.speaker}</p>
              <p className="text-sm text-slate-700 italic">"{entry.text}"</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.items.length > 0 ? (
                  entry.items.map((it) => (
                    <span key={it.id} className={`inline-flex items-center gap-1 text-xs bg-gradient-to-br ${getCategoryTint(it)} px-2 py-1 rounded-full`}>
                      {getProductEmoji(it)} {it.name.split(" ").slice(0, 2).join(" ")}
                      {quantities[it.id] > 1 ? ` ×${quantities[it.id]}` : ""}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No items matched — try product names.</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-sm">
          Done — view shared cart
        </button>
      </div>
    </div>
  );
}
