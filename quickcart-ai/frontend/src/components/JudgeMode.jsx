export function JudgeModeToggle({ judgeMode, setJudgeMode }) {
  return (
    <button
      onClick={() => setJudgeMode(!judgeMode)}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all ${
        judgeMode ? "bg-slate-900 text-white" : "bg-white text-gray-600 border border-gray-200"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${judgeMode ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} />
      Judge mode {judgeMode ? "ON" : "OFF"}
    </button>
  );
}

export function JudgeAnnotation({ active, label, children }) {
  if (!active) return children;
  return (
    <div className="relative ring-2 ring-slate-900/70 rounded-2xl">
      {children}
      <div className="absolute -top-2.5 left-3 z-20">
        <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap font-mono animate-slide-in">
          {label}
        </div>
      </div>
    </div>
  );
}
