# UrbanRush — Product Requirements Document

> **One line:** Don't search for products — describe your situation, and AI builds the cart.
> Built for **HackOn with Amazon 2025**.

---

## 1. The Problem

- Quick-commerce shoppers arrive with **urgent, high-context needs** — *"guests in 30 minutes," "baby has fever"* — but the app forces them to translate that into **search terms, browse SKUs, and assemble a cart manually**.
- Average shopper spends **4–7 minutes** searching/adding — even though delivery is promised in **under 15 minutes**.
- Friction is **highest exactly when the customer is most stressed** (sick kid, surprise guests, power cut).

## 2. Why It Matters

- India q-commerce: **$5B+ by 2025**, **10M+ daily orders**. Global q-commerce: **$45B+, growing 25% YoY**.
- **Cart abandonment > 70%** — mostly decision fatigue, weak search, and time pressure.
- Every minute of friction = lost revenue + churn. Whoever makes buying **fastest and most intuitive wins**.

## 3. How It Aligns With the Theme

> *Theme: "help customers discover, decide, and purchase what they need in the fastest, most effortless way."*

- We don't optimize search — we **replace it** with a **situation box**.
- Mental model shifts from **"what product do I need?"** → **"what situation am I in?"**
- Time-to-cart drops from **minutes → ~15 seconds**, with **zero product knowledge** required.

| Theme verb | How UrbanRush delivers it |
|------------|---------------------------|
| **Discover** | Situation text, voice, photo, Panic Mode, predictive nudges, **Personalized Kits (pre-input, history-based)** |
| **Decide** | AI-built cart + urgency heatmap + confidence + reasons + one-tap swap |
| **Purchase** | One-tap review cart + steppers + regret-free checkout |

## 4. What Makes It Novel

- Existing solutions improve **search** (autocomplete, filters, ranking). **No one replaced search with situational intent.**
- Key insight: **customers think in problems, not SKUs.**
- From a plain sentence, the AI infers **occasion, urgency, people count, budget** → builds a **prioritized cart** with **Critical / Helpful / Nice-to-have** tiers and a **confidence score**.
- **Multi-modal + zero-input**: voice, "situation selfie" (photo), and **Panic Mode** (reads time + weather + location, no typing).

## 5. Target Customer

- Urban Indians **22–35** — working professionals, parents, students on Blinkit/Instamart.
- **Time-poor, task-overloaded.** They know the *situation*, not the *product list*.
- Need: **need → checkout in under a minute**, no browsing.

## 6. The Solution — Key Features

- **Situational Intent Engine** — type/speak/snap; Claude 3.5 Sonnet (AWS Bedrock) extracts occasion, urgency, people, budget → builds the cart.
- **Urgency Heatmap** — every item tagged 🔴 Critical / 🟡 Helpful / 🟢 Nice-to-have for instant cut decisions.
- **Smart Bundle Engine** — detects missing essentials (e.g., napkins for a party) and auto-fills the gap.
- **Panic Mode** — zero typing; reads time + live weather + location.
- **One-tap Swap** — remove/switch any item, 3 AI-ranked alternatives appear inline (and it **learns your brand preference**).
- **AI-Generated Kits** — the cart is presented as themed bundles (Comfort / Energy / Snack kits) each with a match score + one-line "why" + Explain/Edit.
- **Personalized Kits row** — on the home screen, *before* the user types anything, a "Suggestions for [Name]" strip shows themed kits (Morning Essentials, Snack Time, Drinks, Personal Care, Kitchen Staples) built from their on-device purchase history. Each kit has product thumbnails, item name pills, a "why" line, total price, and a single "Add all" button. Zero AI cost — pure client-side personalization that surfaces intent proactively.
- **Personalization** — greeting, "Your usual" badges, depletion prediction ("milk runs out in ~1 day"), weekly budget envelope, learned brand preference.
- **Beyond-feature differentiators** — Situational Memory (replay), Live Thinking Stream, Cart Diff, Crisis Triage, Party Mode (group voice cart), Mood→cart, Recipe→cart.

## 6a. How It Runs on Amazon (services mapping)

| Layer | Amazon service | Role |
|-------|----------------|------|
| LLM intent + reasoning | **Amazon Bedrock — Claude 3.5 Sonnet** (`apac` profile, `ap-south-1`) | Situation → structured intent JSON; streamed reasoning. Managed, no GPU ops. |
| Throughput at scale | **Bedrock Provisioned Throughput** | Removes on-demand throttle under load. |
| API backend | **ECS / Fargate** behind an **ALB** | Stateless FastAPI; horizontal autoscaling. |
| Catalog (1000s SKUs) | **DynamoDB** / **OpenSearch** | Replaces in-memory JSON; scoring stays catalog-agnostic. |
| Intent cache | **ElastiCache (Redis)** | Cache identical situations (short TTL). |
| Images + web app | **S3 + CloudFront** | Product photos + the React build, globally cached. |
| Personalization store | **DynamoDB** | Per-user profile, preferences, depletion history. |

## 7. Architecture (at a glance)

- **Frontend:** React 18 + Vite + Tailwind (glassmorphism "liquid" theme).
- **Backend:** FastAPI (async, SSE streaming, auto OpenAPI).
- **AI:** AWS Bedrock — Claude 3.5 Sonnet (apac inference profile, ap-south-1).
- **Data:** 100-product catalog, in-memory (O(n) scoring, microseconds).
- **6-stage pipeline:** intent → recommend (4-factor score) → diversify → bundle → batched reasons → optimize.
- **Resilience:** every AI call has a deterministic fallback (rule engine) → **the demo never breaks**.

Scoring formula (weights are live-tunable from the UI):
```
score = intent×0.5 + budget×0.3 + availability×0.1 + rating×0.1
```

## 8. Scaling

- **Stateless backend** → horizontal scale with zero code changes.
- **Catalog scoring:** O(n) now; pre-embed + ANN (FAISS/pgvector) at scale.
- **Bedrock ceiling:** Redis intent cache + batched reasons (n→1 calls) + Provisioned Throughput.
- **Catalog:** JSON → DynamoDB / OpenSearch as SKUs grow; scoring logic is catalog-agnostic.
- **Global:** deploy FastAPI per region → nearest Bedrock inference profile.

## 9. Future Vision

- The intent engine is **platform-agnostic**: describe a situation → get the right action list.
- **Expansion:** Q-commerce → Pharmacy (symptom → care kit) → Food delivery (craving → meal) → B2B procurement → **Intent API** (licensed to other platforms).

| Metric | 12-month | 3-year |
|--------|----------|--------|
| Time to cart | < 8s | < 5s |
| Cart abandonment | −40% vs avg | −60% vs avg |
| Monthly active users | 100K | 5M (3 verticals) |
| GMV facilitated | ₹2Cr | ₹500Cr+ |
| Intent API partners | 10 (beta) | 500+ |

## 10. Impact (the "so what")

- A **10% abandonment drop** on a 1M-orders/day platform = **100,000 extra purchases/day**.
- At ₹300 AOV → **₹3 Cr/day recovered revenue — per platform.**
- The **Intent API** captures value across *every* partner platform, not just our own users.

---

**Links:** GitHub `[URL]` · Demo Video `[URL]` · Live App `[URL]`
