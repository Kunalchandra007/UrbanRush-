import { useState } from "react";
import { panicMode } from "../utils/api";

// Map wttr.in weather codes to our condition strings
function mapWttrCode(code) {
  const c = parseInt(code);
  const rainCodes = [
    395, 392, 389, 386, 377, 374, 371, 368, 365, 362,
    359, 356, 353, 338, 335, 332, 329, 326, 323, 320,
    317, 314, 311, 308, 305, 302, 299, 296, 293, 176,
  ];
  const thunderCodes = [389, 386, 200];
  if (thunderCodes.includes(c)) return "thunderstorm";
  if (rainCodes.includes(c)) return "rain";
  if (c === 113) return "clear";
  if ([116, 119, 122].includes(c)) return "cloudy";
  return "clear";
}

const STAGES = {
  locating: "📍 Finding location...",
  weather: "🌤 Checking weather...",
  building: "⚡ Building your cart...",
};

export default function PanicButton({ onCartBuilt, onLoading }) {
  const [stage, setStage] = useState(null);

  const handlePanic = async () => {
    try {
      onLoading(true);

      // Stage 1: Geolocation (fallback to Delhi)
      setStage("locating");
      let lat = 28.6139, lon = 77.209;
      const city = "Delhi";
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // Geolocation denied/unavailable — use Delhi fallback silently
      }

      // Stage 2: Real weather from wttr.in
      setStage("weather");
      let weatherCondition = "clear";
      let tempC = 28;
      try {
        const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const data = await res.json();
        const cur = data.current_condition?.[0];
        if (cur) {
          weatherCondition = mapWttrCode(cur.weatherCode);
          tempC = parseFloat(cur.temp_C);
        }
      } catch {
        // wttr.in unavailable — use defaults
      }

      // Stage 3: Build cart
      setStage("building");
      const now = new Date();
      const isWeekend = [0, 6].includes(now.getDay());

      const { data } = await panicMode({
        city,
        hour: now.getHours(),
        weather: weatherCondition,
        temperature_c: tempC,
        is_weekend: isWeekend,
        past_occasion: localStorage.getItem("qc_last_occasion") || null,
      });

      if (data.intent?.occasion) {
        localStorage.setItem("qc_last_occasion", data.intent.occasion);
      }

      onCartBuilt(data);
    } catch (err) {
      console.error("Panic mode failed:", err);
      alert("Panic mode failed. Try text input instead.");
    } finally {
      setStage(null);
      onLoading(false);
    }
  };

  return (
    <button
      onClick={handlePanic}
      disabled={!!stage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                  transition-all duration-200 ${
                    stage
                      ? "bg-red-100 text-red-400 cursor-wait"
                      : "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                  }`}
    >
      {stage ? (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          {STAGES[stage]}
        </span>
      ) : (
        "⚡ Panic"
      )}
    </button>
  );
}
