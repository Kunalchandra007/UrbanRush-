import { useState } from "react";
import { getWeeklyBudget, setWeeklyBudget, getWeeklySpent } from "../utils/personalization";

// Budget envelope: plan a weekly budget across multiple orders, not one cart.
export default function WeeklyEnvelope({ refreshKey }) {
  const [budget, setBudget] = useState(getWeeklyBudget());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("500");

  const spent = getWeeklySpent(); // re-read each render; refreshKey forces update
  void refreshKey;

  if (!budget && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 font-medium hover:underline"
      >
        💰 Set a weekly budget
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">₹ / week</span>
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-20 h-9 rounded-xl bg-white/80 border border-white/60 px-2 text-sm outline-none focus:border-blue-400"
        />
        <button
          onClick={() => {
            const v = parseInt(draft, 10);
            if (v > 0) {
              setWeeklyBudget(v);
              setBudget(v);
            }
            setEditing(false);
          }}
          className="h-9 px-3 rounded-xl bg-blue-500 text-white text-sm font-semibold"
        >
          Set
        </button>
      </div>
    );
  }

  const remaining = budget - spent;
  const pct = Math.min((spent / budget) * 100, 100);
  const daysLeft = 7; // simplified
  const perDay = Math.max(Math.round(remaining / daysLeft), 0);
  const over = remaining < 0;

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600">💰 Weekly envelope</span>
        <button onClick={() => setEditing(true)} className="text-[11px] text-blue-500 hover:underline">
          edit
        </button>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${over ? "text-red-600" : "text-slate-500"}`}>
        {over
          ? `₹${Math.abs(remaining)} over budget this week`
          : `₹${remaining} left of ₹${budget} · ~₹${perDay}/day to last the week`}
      </p>
    </div>
  );
}
