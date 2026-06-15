import KitCard from "./KitCard";

export default function KitsRow({ groups, intent, onEdit }) {
  const entries = Object.entries(groups || {});
  if (entries.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mb-4">
      {entries.map(([label, items]) => (
        <KitCard key={label} label={`${label} Kit`} items={items} intent={intent} onEdit={onEdit} />
      ))}
    </div>
  );
}
