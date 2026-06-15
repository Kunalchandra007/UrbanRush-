const NODES = [
  { icon: "❤️", label: "Favorites", pos: "top-1 left-1/2 -translate-x-1/2" },
  { icon: "😊", label: "Mood", pos: "top-1/3 right-1" },
  { icon: "🌤️", label: "Weather", pos: "bottom-1/4 right-2" },
  { icon: "🕐", label: "Time", pos: "top-1/3 left-1" },
  { icon: "📸", label: "History", pos: "bottom-1/4 left-2" },
];

export default function MemoryOrbit() {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-500">✦</span>
        <h3 className="text-sm font-bold text-slate-700">AI Memory Orbit</h3>
      </div>
      <p className="text-xs text-slate-400 mb-2">What I use to personalize for you</p>

      <div className="relative h-44">
        {/* orbit rings */}
        <div className="absolute inset-4 rounded-full border border-blue-200/50" />
        <div className="absolute inset-10 rounded-full border border-blue-200/40" />

        {/* center brain glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/40 thinking-pulse">
            🧠
          </div>
        </div>

        {/* orbiting nodes */}
        {NODES.map((n) => (
          <div key={n.label} className={`absolute ${n.pos} flex flex-col items-center`}>
            <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-sm">
              {n.icon}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
