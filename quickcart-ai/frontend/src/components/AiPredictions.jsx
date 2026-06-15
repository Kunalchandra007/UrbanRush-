export default function AiPredictions({ depletion = [], weather = "", onQuery, onAddItem }) {
  const hour = new Date().getHours();
  const cards = [];

  if (/rain|drizzle|storm|thunder/i.test(weather)) {
    cards.push({ icon: "🌧️", title: "Rain expected", sub: "soon near you", pct: 80, q: "rain is coming" });
  }
  depletion.slice(0, 1).forEach((d) =>
    cards.push({
      icon: "🥛",
      title: `${d.name.split(" ").slice(0, 2).join(" ")} likely`,
      sub: d.daysLeft === 0 ? "running out today" : "running low",
      pct: 90,
      item: { id: d.id, name: d.name, category: d.category, price_inr: d.price, image_url: d.image_url, _score: 0.8 },
    })
  );
  if (hour >= 19 || hour < 2) {
    cards.push({ icon: "🍿", title: "Evening snack time", sub: "detected", pct: 92, q: "evening snacks for tonight" });
    cards.push({ icon: "🎓", title: "Late-night study?", sub: "detected", pct: 85, q: "exam tomorrow morning" });
  } else if (hour >= 6 && hour <= 10) {
    cards.push({ icon: "🍳", title: "Breakfast time", sub: "detected", pct: 88, q: "breakfast for 2 people" });
  }
  cards.push({ icon: "❤️", title: "Your comfort items", sub: "nearby", pct: 94, q: "I'm feeling low today" });

  if (cards.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-500">✦</span>
        <h3 className="font-bold text-slate-800">AI Predictions for You</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => (c.item ? onAddItem?.(c.item) : onQuery?.(c.q))}
            className="flex-shrink-0 w-44 text-left glass rounded-2xl p-3 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <div className="text-2xl mb-1.5">{c.icon}</div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{c.title}</p>
            <p className="text-xs text-slate-400">{c.sub}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-sky-400 rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="text-xs font-bold text-blue-600">{c.pct}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
