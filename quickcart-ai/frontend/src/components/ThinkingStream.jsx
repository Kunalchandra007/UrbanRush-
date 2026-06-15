import { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

export default function ThinkingStream({ userInput, weights = {}, active, onComplete }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active || !userInput) return;
    setText("");
    const controller = new AbortController();

    const params = new URLSearchParams({
      w_intent: weights.intent ?? 0.5,
      w_budget: weights.budget ?? 0.3,
      w_avail: weights.availability ?? 0.1,
      w_rating: weights.rating ?? 0.1,
    });

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/intent/extract-stream?${params}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_input: userInput, user_id: localStorage.getItem("qc_user_id") || "guest" }),
          signal: controller.signal,
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));
            if (data.token) setText((prev) => prev + data.token);
            if (data.done) onComplete(data);
          }
        }
      } catch (e) {
        if (e.name !== "AbortError") onComplete({ error: true });
      }
    })();

    return () => controller.abort();
  }, [active, userInput]);

  if (!active) return null;

  const displayText = text.split("RESULT:")[0].replace("THINKING:", "").trim();

  return (
    <div className="bg-slate-900 rounded-2xl px-4 py-3 font-mono text-xs text-green-400 min-h-[72px] shadow-lg">
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span>AI reasoning — live</span>
      </div>
      <p className="leading-relaxed">
        {displayText || "Thinking…"}
        <span className="inline-block w-1.5 h-3 bg-green-400 ml-0.5 animate-pulse align-middle" />
      </p>
    </div>
  );
}
