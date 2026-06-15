export default function ClarificationBubble({ clarification, onAnswer }) {
  return (
    <div className="px-4 mt-4 animate-slide-in">
      {/* AI chat bubble */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          AI
        </div>
        <div className="bg-blue-600 text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-xs">
          <p className="text-sm leading-relaxed">{clarification.question}</p>
        </div>
      </div>

      {/* Option buttons — WhatsApp quick-reply style */}
      <div className="flex flex-wrap gap-2 ml-10">
        {clarification.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 rounded-full
                       text-sm font-semibold hover:bg-blue-500 hover:text-white
                       active:scale-95 transition-all"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
