export default function AskBubble({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-3 py-3 rounded-full
                 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/40
                 hover:scale-105 active:scale-95 transition-all"
      title="Ask UrbanRush"
    >
      <span className="text-sm font-semibold hidden sm:block leading-tight text-left">
        Ask UrbanRush
        <span className="block text-[10px] text-blue-100 font-normal">I'm here to help</span>
      </span>
      <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">✦</span>
    </button>
  );
}
