# UrbanRush — Demo Script (2–3 minutes)

Goal: show that we **replaced search with situational intent** and made buying effortless.
Use **Chrome or Edge** (voice needs them). Have both servers running before you start.

---

## Pre-demo checklist (do this 5 min before)

- [ ] Backend running: `http://localhost:8000/health` returns `{"status":"ok"}`
- [ ] Frontend running: `http://localhost:5173/`
- [ ] Browser = **Chrome/Edge**, mic + location permission **allowed**
- [ ] Product images present in `frontend/public/products/`
- [ ] To demo "new user": clear site data (DevTools → Application → Clear storage). To demo "returning user": leave it.
- [ ] Zoom browser to ~90% so the two-panel layout fits.

---

## The 90-second core demo (the money shot)

| Time | Do this | Say this |
|------|---------|----------|
| 0:00 | Land on the app. Point to the **situation box** (not a search bar). | "Quick-commerce apps make you search and assemble a cart. We replaced search with one box — describe your situation." |
| 0:08 | Type **"I have guests coming in 30 minutes"** → Go | "Watch — I'm not searching for products, I'm describing a moment." |
| 0:10 | The **AI reasoning streams live**, then the cart builds. | "That's the AI thinking in real time — not a spinner." |
| 0:16 | Point to **urgency colors**, **confidence %**, **AI reasons**, **Smart Bundle** banner. | "A full cart in ~15 seconds — prioritized Critical / Helpful / Nice-to-have, with a confidence score, and it auto-added the essentials I'd forget." |
| 0:30 | It asks **"How many guests?"** → tap **5–8**. | "It even asks the one question that changes the cart — quantities scale per person." |
| 0:40 | Hit **Place Order** → **Regret-Free 10s confirm** appears → confirm. | "Speed causes mistakes, so we add a 10-second safety net for risky quantities." |

That alone wins the core theme. Everything below is "and there's more."

---

## The "wow" round (pick 3–4 based on time)

1. **Panic Mode** (top-right red button) → "Zero typing. It reads time, **live weather**, and location to build a cart." (Rainy evening → umbrella + chai + Maggi.)
2. **Voice** → click 🎙, say *"movie night for five"* → words stream in, cart builds on pause.
3. **Mood → cart** → type *"I'm feeling low today"* → comfort cart (chocolate, ice cream).
4. **Recipe → cart** → type *"make maggi for 4"* → exact ingredients, scaled.
5. **One-tap Switch** → on Pepsi, click **⇄ Switch** → pick Coca-Cola → "And it **remembers** that brand for next time."
6. **Situational Memory** → run the same chip twice → second time shows *"Last time you ordered…"*
7. **Predictions** (empty state) → "It predicts what you'll run out of — milk in ~1 day."
8. **Party Mode** → everyone speaks into one mic, items dedupe into a shared cart.

---

## Closing line (memorize this)

> "What takes 5 minutes of searching on Blinkit takes 15 seconds here — because we stopped
> making people shop. They describe the situation; the AI does the rest. And it works even
> if the AI is down, because every step has a deterministic fallback."

---

## If something fails (graceful recovery)

- **Voice error** → "Voice needs Chrome/Edge + mic permission — let me type it instead." (Type the same thing.)
- **AWS billing not active** → "We're in demo mode — the rule-based fallback builds the same cart, which is itself an architecture feature: AI enhances, never blocks."
- **Image missing** → it shows a clean category tile; don't dwell on it.

---

## 60-second video cut (if recording)

1. 0:00 situation box + type "guests in 30 minutes" → cart builds (reasoning stream).
2. 0:20 urgency heatmap + confidence + bundle banner + follow-up question.
3. 0:35 Panic Mode (weather) OR voice.
4. 0:48 Place Order → regret guard → order placed countdown.
5. 0:55 closing line over the cart screen.
