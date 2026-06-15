function SkeletonCard() {
  return (
    <div className="bg-white/80 rounded-2xl border border-white/60 overflow-hidden animate-pulse">
      <div className="h-28 bg-gradient-to-br from-gray-100 to-blue-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="h-3 bg-blue-100 rounded-full w-2/3" />
        <div className="flex justify-between items-center mt-3">
          <div className="h-4 bg-gray-200 rounded w-8" />
          <div className="h-7 bg-green-200 rounded-xl w-14" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonGrid() {
  return (
    <div className="p-1">
      <div className="h-4 bg-gray-200 rounded-full w-40 mb-3 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonCard key={i} />
          ))}
      </div>
    </div>
  );
}
