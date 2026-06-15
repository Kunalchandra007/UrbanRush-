export default function AISummaryBanner({ summary, timeSaved }) {
  if (!summary) return null;
  return (
    <div className="mb-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl px-4 py-3">
      <p className="text-sm text-blue-800 italic leading-relaxed">{summary}</p>
      {timeSaved && (
        <p className="text-xs text-green-600 font-semibold mt-1.5">⏱ {timeSaved}</p>
      )}
    </div>
  );
}
