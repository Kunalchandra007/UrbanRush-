# ⚡ UrbanRush

> Life Moves Fast. We Move First. — Built for **HackOn with Amazon 2025**.

UrbanRush is a Blinkit/Instamart-style quick-commerce app where you describe a
**situation** in plain language ("guests coming in 30 minutes", "baby has fever",
"I'm feeling sad", "make maggi for 4") and an AI instantly builds a complete,
prioritized, explained shopping cart — collapsing **discover → decide → purchase**
into ~15 seconds instead of 5 minutes of manual searching.

> 📐 For a full system walkthrough see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
> 📝 Pitch & problem fit: **[PRD.md](./PRD.md)** · 🎬 Demo: **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** · 🚀 Hosting: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## ✨ Features

**Input & discovery**
- **Intent AI** — Claude 3.5 Sonnet turns a situation into structured intent.
- **Live voice input** — words stream in as you speak; auto-builds on pause.
- **Situation selfie** — snap a photo; Claude Vision reads the scene → cart.
- **Panic mode** — zero typing; reads time + live weather (wttr.in) + location.
- **Multi-modal fusion** — chain voice + text + photo into one cart (🔗 Combine).
- **Party mode** — group voice cart: everyone speaks, items dedupe into one cart.
- **Live suggestions** — typing shows add-able catalog matches instantly.
- **Browse-first feed** — all 100 products by category tab on first load.
- **Mood → cart** — "I'm sad / lazy / tired / sick" → comfort/recharge/emergency carts.
- **Recipe → cart** — "make maggi for 4" → exact scaled ingredient list.

**Decision intelligence**
- **4-factor scoring** + **category diversity** + **Smart Bundle Engine** (gap-fill).
- **Urgency heatmap** — 🔴 Critical / 🟡 Helpful / 🟢 Nice-to-have.
- **Confidence score**, **per-item AI reasons**, **AI cart summary**.
- **Live scoring tuner** — re-weight the formula and watch a **cart diff** (NEW badges).
- **One-tap swap** with **substitution reasons**; **crisis triage**; **follow-up questions**.
- **Live "thinking" stream** — watch the AI reason token-by-token (SSE).

**Personalization (on-device + per-user profile)**
- **Onboarding** — captures name + dietary prefs on first launch.
- **Personal greeting** with live weather + detected location.
- **"⭐ Your usual"** badges; **situational memory / replay**; **adaptive scenario chips**.
- **Consumption-rate depletion engine** ("milk runs out in ~1 day").
- **Weekly budget envelope** — spend tracked across orders.
- **Silent dietary filter**, **quantity-per-person** scaling, and **learned brand preference** (⇄ Switch remembers your pick).

**Purchase**
- **AI Predictions strip** + **Memory Orbit** dashboard.
- **Instamart-style review cart** + quantity steppers.
- **Regret-free checkout** — 10s safety-net confirm for high-quantity items.
- **Order success** + delivery countdown; **cart narration** (read aloud).

---

## 🧱 Tech Stack

- **Backend:** FastAPI (Python), AWS Bedrock (Claude 3.5 Sonnet), boto3
- **Frontend:** React 18 + Vite + Tailwind CSS (glassmorphism / liquid blue-white theme)
- **Data:** 100-product Indian quick-commerce catalog (`backend/data/products.json`)

---

## 📁 Project Structure

```
quickcart-ai/
├── backend/
│   ├── main.py                       # FastAPI app + CORS + /health
│   ├── routers/intent.py             # All API endpoints
│   ├── services/
│   │   ├── bedrock_client.py         # Bedrock wrapper (retry/backoff)
│   │   ├── intent_engine.py          # Intent extraction, reasons, summary, clarification + fallback
│   │   ├── recommendation_engine.py  # Scoring + diversity + bundle hook
│   │   ├── bundle_engine.py          # Gap detection + cart completion
│   │   ├── cart_optimizer.py         # Totals, groups, confidence, time-saved
│   │   ├── panic_engine.py           # Context fusion (time/weather/location)
│   │   ├── vision_engine.py          # Claude Vision scene analysis
│   │   └── context_engine.py         # Mock user profile
│   ├── data/products.json            # 100 products
│   └── .env                          # AWS credentials (not committed)
└── frontend/
    ├── index.html                    # Favicon + title (uses logo.jpg)
    ├── public/logo.jpg               # App logo (header + favicon)
    └── src/
        ├── pages/Home.jsx            # Main two-panel layout + quantity system
        ├── components/               # ProductCard, CategorySection, CartDrawer,
        │                             # BrowsableHomeFeed, SkeletonGrid, IntentBadge,
        │                             # AISummaryBanner, VoiceButton, CameraButton,
        │                             # PanicButton, ScenarioChips, ScoringTuner,
        │                             # BundleInsightBanner, AlternativePicker,
        │                             # BudgetSlider, ClarificationBubble, AddItemSheet
        ├── utils/api.js              # API client
        ├── utils/urgencyColor.js     # Urgency heatmap logic
        └── index.css                 # Liquid glass theme + animations
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- An AWS account with **Bedrock access to Claude 3.5 Sonnet** and a valid payment method

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
# Use the regional inference-profile model ID (required for on-demand Claude 3.5 v2):
BEDROCK_MODEL_ID=apac.anthropic.claude-3-5-sonnet-20241022-v2:0
OPENWEATHER_API_KEY=demo_mode
```

Run it:

```bash
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Verify credentials any time with: `python test_aws_connection.py`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173/**

> To point the frontend at a deployed backend, set `VITE_API_BASE` (e.g. in `frontend/.env`).
> Defaults to `http://localhost:8000`. See **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## 🔌 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/intent/extract` | Build a cart from text (supports `?w_intent=&w_budget=&w_avail=&w_rating=`) |
| POST | `/intent/panic` | Zero-input cart from time/weather/location |
| POST | `/intent/analyze-image` | Build a cart from a photo (Claude Vision) |
| POST | `/intent/fuse` | Fuse multiple inputs (voice + text + image) into one cart |
| GET | `/intent/alternatives` | 3 ranked swap alternatives for a removed item |
| GET | `/intent/search` | Catalog search — powers the browse feed + "add your own item" |

---

## � How Scoring Works

```
score = intent_match × 0.5  +  budget_fit × 0.3  +  availability × 0.1  +  rating × 0.1
```

Weights are tunable live from the UI (Scoring Tuner). After scoring, a diversity pass
caps any single category at 3 items, then the Bundle Engine fills missing essentials.

---

## 🛟 Demo Mode (resilient fallback)

If Bedrock is unavailable (billing, throttling, or no network), the backend automatically
falls back to a **rule-based keyword engine** so the app still builds relevant carts. The
moment Bedrock is reachable again, it switches back to real Claude AI — no code changes.

---

## 📝 Notes

- Voice input works in **Chrome / Edge**; allow microphone access when prompted.
- `BEDROCK_MODEL_ID` must be a regional inference profile (e.g. `apac.` for ap-south-1),
  not the bare `anthropic.…` ID.
- Product visuals use clean, relevant **emoji icons on category-tinted tiles** (instant,
  reliable, never broken). Reliable real product photos would need an image API key
  (Unsplash/Pexels) or a curated per-SKU dataset.
- The app logo lives at `frontend/public/logo.jpg` (used in the header and as the favicon).
