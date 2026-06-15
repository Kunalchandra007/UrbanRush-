import { useState, useEffect } from "react";
import { getUserName, setUserName } from "../utils/personalization";

function greetWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Hey";
}

function weatherLine(weather, city, hour) {
  const c = (weather || "").toLowerCase();
  const when = hour >= 17 ? "tonight" : "today";
  if (c.includes("rain") || c.includes("drizzle"))
    return `rain expected ${when} near ${city} — keep an umbrella handy ☔`;
  if (c.includes("thunder") || c.includes("storm"))
    return `storms likely ${when} near ${city} ⛈️ stay safe`;
  if (c.includes("snow")) return `snowfall near ${city} ❄️`;
  if (c.includes("cloud") || c.includes("overcast")) return `cloudy near ${city} ☁️`;
  if (c.includes("clear") || c.includes("sun")) return `clear skies near ${city} ☀️`;
  return `${weather || "pleasant"} near ${city}`;
}

export default function GreetingHeader({ onLocation }) {
  const [name, setName] = useState(getUserName());
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    let lat = 28.6139, lon = 77.209;
    const finish = async () => {
      try {
        const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const data = await res.json();
        const cur = data.current_condition?.[0] || {};
        const area =
          data.nearest_area?.[0]?.areaName?.[0]?.value ||
          data.nearest_area?.[0]?.region?.[0]?.value ||
          "your area";
        const region = data.nearest_area?.[0]?.region?.[0]?.value;
        setCtx({ city: area, weather: cur.weatherDesc?.[0]?.value || "clear", temp: cur.temp_C });
        if (onLocation) onLocation(region && region !== area ? `${area}, ${region}` : area);
      } catch {
        setCtx({ city: "your area", weather: "clear", temp: null });
      }
    };
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        finish();
      },
      () => finish(),
      { timeout: 5000 }
    );
    if (!navigator.geolocation) finish();
  }, []);

  const editName = () => {
    const n = window.prompt("What should I call you?", name);
    if (n) {
      setUserName(n);
      setName(n.trim());
    }
  };

  const hour = new Date().getHours();

  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base font-bold text-slate-800">
          {greetWord()},{" "}
          <button onClick={editName} className="text-blue-600 hover:underline">
            {name}
          </button>{" "}
          👋
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {ctx ? weatherLine(ctx.weather, ctx.city, hour) : "Checking your local weather…"}
          {ctx?.temp ? ` · ${ctx.temp}°C` : ""}
        </p>
      </div>
      <span className="text-2xl flex-shrink-0">
        {ctx && /rain|drizzle|storm|thunder/i.test(ctx.weather) ? "🌧️" : hour >= 19 || hour < 6 ? "🌙" : "☀️"}
      </span>
    </div>
  );
}
