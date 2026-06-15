# UrbanRush — Architecture

How the whole system works, end to end. For HackOn with Amazon 2025.

---

## 1. The problem we solve

> Quick-commerce shoppers arrive with an **immediate need** and want to finish in
> **seconds**, yet apps still make them search, browse, and decide manually.
> How might we help them **discover → decide → purchase** in the fastest, most
> effortless way?

Our answer: **don't make people shop — let them describe a situation and get a
ready-to-buy cart.** Type/say/snap "guests in 30 mins" → a full, prioritized,
explained cart in ~15 seconds.

| Stage | How we collapse it |
|-------|--------------------|
| **Discover** | Situation input, Panic mode, voice, camera, predictive depletion nudges, browse feed |
| **Decide** | AI builds + scores + bundles the cart; urgency heatmap, confidence, reasons, swaps |
| **Purchase** | One-tap review cart + steppers; regret-free checkout |

---

## 2. Tech stack

```
Frontend   React 18 + Vite + Tailwind CSS        (glassmorphism "liquid" theme)
Backend    FastAPI (Python) + Uvicorn
AI         AWS Bedrock — Claude 3.5 Sonnet (apac inference profile, ap-south-1)
Data       100-product JSON catalog (Indian quick-commerce SKUs)
State      In-memory (situational memory) + browser localStorage (personalization)
External   wttr.in (free weather), Web Speech API (browser voice)
```

---

## 3. High-level architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              BROWSER (React)                           │
│                                                                        │
│  Home.jsx  ── orchestrates all state & data flow                       │
│   ├─ Inputs:  text · VoiceButton · CameraButton · PanicButton          │
│   │           ScenarioChips · AutoSuggest · PartyMode · Combine/Fusion │
│   ├─ Output:  IntentBadge · AISummaryBanner · CategorySection→         │
│   │           ProductCard grid · ReviewCart · RegretGuard              │
│   ├─ Smart UI: ReplayBanner · CrisisTriage · FollowUpQuestion ·        │
│   │            BundleInsightBanner · ThinkingStream · JudgeMode        │
│   └─ Personalization (localStorage): greeting, "Your usual",           │
│      depletion engine, weekly budget envelope                          │
│                                                                        │
│        │  HTTP / SSE (axios + fetch streaming)                         │
└────────┼───────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          FastAPI BACKEND                               │
│                                                                        │
│  routers/intent.py  ── all endpoints, orchestration                    │
│        │                                                               │
│        ▼   the 6-stage pipeline                                        │
│  intent_engine → recommendation_engine → bundle_engine →               │
│       cart_optimizer → memory_engine → (reasons + summary)             │
│        │                                                               │
│        ├─ bedrock_client.py  → AWS Bedrock (Claude)                    │
│        ├─ panic_engine.py    → context fusion (time/weather/location)  │
│        ├─ vision_engine.py   → Claude Vision (photo → intent)          │
│        └─ context_engine.py  → user profile (mock)                     │
│                                                                        │
│  data/products.json  ── 100 products (loaded once at startup)          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. The core pipeline (what happens on every cart build)

When the user submits a situation, `routers/intent.py` runs this chain:

```
user_input
   │
   ▼
1. intent_engine.extract_intent()
      • recipe?  → _recipe_intent()       (deterministic)
      • mood?    → _mood_intent()          (deterministic)
      • else     → Claude on Bedrock → structured JSON
      • on any failure → _fallback_intent() (keyword rule engine)
   → intent = {situation, occasion, urgency, people_count, budget_inr,
               product_categories, keywords, ...}
   │
   ▼
2. recommendation_engine.recommend(intent, weights)
      • score every in-stock product:
          score = intent×0.5 + budget×0.3 + availability×0.1 + rating×0.1
      • sort, then diversify() → max 3 per category
   │
   ▼
3. bundle_engine.apply_bundles()
      • detect missing essential categories for the occasion
      • inject best product per gap  (marked _injected)
   │
   ▼
4. intent_engine.generate_reasons_batch()   (ONE LLM call for all items)
      • attaches a per-item _reason ("Popular party snack for 5 guests")
   │
   ▼
5. cart_optimizer.build_cart()
      • totals, category groups, confidence = avg(_score)×100,
        delivery estimate, time-saved
   │
   ▼
6. intent_engine.generate_cart_summary()  + memory_engine.record_situation()
      • warm 2-sentence summary; remember the situation for "replay"
   │
   ▼
response = { intent, cart, replay_suggestion, triage, followup }
```

**Weights** are sent as query params (`?w_intent=&w_budget=&w_avail=&w_rating=`)
so the **Live Scoring Tuner** can re-rank in real time.

---

## 5. Resilience: AI with a rule-based safety net

Bedrock can be unavailable (billing, throttling, offline). Every AI touchpoint has
a deterministic fallback, so the demo never breaks:

| AI call | Fallback |
|---------|----------|
| `extract_intent` | `_fallback_intent()` keyword rule engine (sets `_demo_mode`) |
| `generate_reasons_batch` | `_smart_fallback_reason()` per category |
| `generate_cart_summary` | templated summary |
| `get_crisis_triage` | hardcoded triage for baby_care/emergency |
| `extract_intent_stream` | synthesized token stream from the rule engine |
| `bedrock_client.invoke` | retry w/ exponential backoff on throttling |

Recipe and mood intents are **always deterministic** (no LLM needed), so they're
instant and reliable.

---

## 6. Endpoints (routers/intent.py)

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/health` | health check |
| POST | `/intent/extract` | situation → cart (+ replay, triage, followup) |
| POST | `/intent/extract-stream` | same, but **SSE** streams the AI's reasoning live |
| POST | `/intent/panic` | zero-input cart from time/weather/location |
| POST | `/intent/analyze-image` | photo → Claude Vision → cart |
| POST | `/intent/fuse` | merge voice + text + image into one cart |
| GET  | `/intent/alternatives` | 3 ranked swaps for a removed item (+ reason) |
| GET  | `/intent/search` | catalog search (browse feed, add-item, suggestions) |
| POST | `/intent/parse-items` | extract products from a sentence (Party Mode) |
| POST | `/intent/refine` | rebuild cart from an augmented intent (triage/follow-up/switch) |
| POST | `/intent/profile` · GET `/intent/profile/{id}` | per-user profile (name, dietary) |
| GET | `/intent/scenarios/{id}` | personalized scenario-chip ordering |
| POST | `/intent/preference` | remember a chosen brand for a category |

### Per-user memory & personalization

- **`user_memory.py`** stores one JSON profile per `user_id` (sent on every request):
  name, dietary, price tier, favorite categories, frequent items, last-10 situations,
  and **preferred brands**.
- `_apply_profile()` (in the router) runs after every cart build to: silently **filter
  dietary** violations, swap in **learned brand preferences**, and mark **"Your usual"** items.
- **Adaptive scenario chips** are re-scored by time-of-day + history.
- On the client, lightweight signals also live in `localStorage` (`personalization.js`):
  greeting name, depletion engine, weekly budget envelope, "your usual" set.
- **Quantity-per-person:** consumable categories scale to `intent.people_count` on cart load.
- **Switch + preference:** the ⇄ switcher replaces an item via a client `replacements` map
  (no quantity reset) and persists the choice via `/intent/preference`.

---

## 7. Feature map (where each lives)

**Input / discovery**
- Situation text + `AutoSuggest` (live product suggestions) — `Home.jsx`, `AutoSuggest.jsx`
- Voice (live transcription) — `VoiceButton.jsx`
- Camera (Claude Vision) — `CameraButton.jsx`, `vision_engine.py`
- Panic mode (real weather via wttr.in) — `PanicButton.jsx`, `panic_engine.py`
- Multi-modal fusion (Combine) — `/intent/fuse`
- Party mode (group voice cart) — `PartyMode.jsx`, `/intent/parse-items`
- Browse feed + category tabs — `BrowsableHomeFeed.jsx`
- Mood → cart / Recipe → cart — `intent_engine._mood_intent / _recipe_intent`

**Decision intelligence**
- 4-factor scoring + diversity — `recommendation_engine.py`
- Smart bundles (gap fill) — `bundle_engine.py`, `BundleInsightBanner.jsx`
- AI-Generated Kits (themed bundle cards) — `KitsRow.jsx`, `KitCard.jsx`
- Urgency heatmap — `utils/urgencyColor.js`, `ProductCard.jsx`
- Confidence score — `cart_optimizer.py`, `IntentBadge.jsx`
- Per-item AI reasons — `generate_reasons_batch`
- Live scoring tuner (re-rank + cart diff) — `ScoringTuner.jsx`, `previousCartIds`
- One-tap swap + substitution reason — `AlternativePicker.jsx`, `/intent/alternatives`
- Crisis triage — `CrisisTriage.jsx`, `get_crisis_triage`
- Follow-up questions (guests / cravings) — `FollowUpQuestion.jsx`, `get_followup`
- Live "thinking" stream — `ThinkingStream.jsx`, `/intent/extract-stream`

**Personalization (browser localStorage, no backend)**  — `utils/personalization.js`
- Personal greeting + live weather — `GreetingHeader.jsx`
- "⭐ Your usual" badge on repeat buys
- Situational memory / "replay" — `memory_engine.py`, `ReplayBanner.jsx`
- Consumption-rate **depletion engine** ("milk runs out in ~1 day")
- **Weekly budget envelope** (spend tracked across orders) — `WeeklyEnvelope.jsx`

**Purchase**
- Instamart-style review cart + steppers — `ReviewCart.jsx`
- Regret-free checkout (10s safety net) — `RegretGuard.jsx`
- Order success + delivery countdown — `Home.jsx`

**Demo / presentation**
- Judge Mode (live architecture labels) — `JudgeMode.jsx`
- Cart narration (Web Speech Synthesis) — `Home.narrateCart`

---

## 8. Data shapes

**Intent**
```json
{ "situation": "...", "occasion": "party", "people_count": 6, "urgency": "high",
  "budget_inr": null, "product_categories": ["snacks","beverages"], "keywords": [] }
```

**Cart**
```json
{ "items": [{ "id":"P001","name":"...","price_inr":30,"_score":0.82,
              "_reason":"...","_injected":false }],
  "groups": {"🍿 Snacks":[...]}, "total_inr": 245, "item_count": 8,
  "confidence": 78.4, "confidence_label": "Confident",
  "estimated_delivery_min": 10, "ai_summary": "...",
  "bundle_insights": [...], "gaps_filled": 1 }
```

**Item flags** used by the UI: `_score`, `_reason`, `_injected` (bundle),
`_swapped`, `_added`/`_custom` (manual), `isNew` (cart diff), `usual` (personalization).

---

## 9. Frontend state model (Home.jsx)

`Home.jsx` is the single orchestrator. Key state:

- **Result**: `intent`, `cart`, `clarification`, `replay`, `triage`, `followup`
- **Quantities**: `quantities` (id→count) + `extraItems` (manual/swapped/party) →
  merged into `allItems`, grouped into `groupedItems`
- **Flow**: `loading`, `streaming` (+ `streamQuery`), `ordered`, `countdown`
- **Controls**: `scoringWeights`, `budget`, `combineMode`, `contextStack`
- **Personalization**: `usualIds`, `reorderNudges`, `depletion`, `envelopeKey`
- **UI**: `showReview`, `showSuggest`, `showParty`, `regretOpen`, `judgeMode`

The cart is rendered from `quantities + allItems` (not the raw API list), so
steppers, manual adds, swaps, and party additions all flow through one model.

---

## 10. Run it

```bash
# Backend
cd backend && venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev   # http://localhost:5173
```

`.env` needs valid AWS creds + `BEDROCK_MODEL_ID=apac.anthropic.claude-3-5-sonnet-20241022-v2:0`.
Without working Bedrock, the app runs fully on the rule-based fallback (demo mode).

---

## 11. Current status

- Backend: all endpoints working & tested.
- Frontend: builds clean; all features integrated.
- AWS Bedrock: blocked on account billing (`INVALID_PAYMENT_INSTRUMENT`) — demo
  mode (rule engine) keeps everything functional until a payment method is added.
- Product images: load `/products/<ID>.jpg` (local) → online photo → emoji tile.
