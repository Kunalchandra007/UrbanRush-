# CLAUDE.md — UrbanRush Build Log & Current State

This file tracks everything built so far and the current state of the project, for
context continuity across sessions.

---

## 🎯 Project Goal

QuickCart AI for **HackOn with Amazon 2025** — a Blinkit/Instamart-style quick-commerce
app. User describes a situation in natural language; AI builds a full, prioritized cart
instantly. Target: fast, visual, judge-impressing demo showcasing AI reasoning.

---

## 🧱 Stack

- **Backend:** FastAPI + Python, AWS Bedrock (Claude 3.5 Sonnet), boto3
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Region:** `ap-south-1` (Mumbai)
- **Model ID:** `apac.anthropic.claude-3-5-sonnet-20241022-v2:0` (regional inference profile)

---

## ✅ What's Been Built (chronological)

### Phase 1 — Core MVP
- FastAPI backend with `/intent/extract`, intent extraction via Bedrock.
- 100-product Indian catalog (`backend/data/products.json`).
- Scoring formula: `intent×0.5 + budget×0.3 + availability×0.1 + rating×0.1`.
- React + Tailwind frontend: text input, voice input, 8 scenario chips, cart display.

### Phase 2 — Advanced features (first batch)
- **Transparent AI reasoning** — per-item `_reason` chips.
- **Situation Selfie** — `vision_engine.py` + `/intent/analyze-image` + CameraButton.
- **Panic Mode** — `panic_engine.py` + `/intent/panic` + PanicButton.
- **Live Scoring Tuner** — dynamic weights via query params + slider UI.
- **Cart Narration** — Web Speech Synthesis reads the cart aloud.

### Phase 3 — Environment setup
- Python venv + all deps installed; frontend deps installed.
- `.env` created; `test_aws_connection.py` helper added.

### Phase 4 — "Full Polish" roadmap
- Real Unsplash image URLs for all 100 products (keyword-mapped).
- `cart_optimizer.py`: category grouping, confidence score, time-saved.
- `generate_cart_summary()` — 2-sentence AI cart summary banner.
- `diversify()` — max 3 items per category.
- Frontend redesign to Blinkit style (first pass).

### Phase 5 — 8-feature roadmap (all implemented)
1. **Urgency Heatmap** — `utils/urgencyColor.js`, colored borders + badges + legend.
2. **Cart Confidence Score** — confidence + label/color + low-confidence nudge.
3. **Real Weather** — PanicButton uses live `wttr.in` + 3 loading stages.
4. **Smart Bundle Engine** — `bundle_engine.py` gap detection + auto-fill + banner.
5. **One-tap Swap** — `/intent/alternatives` + `AlternativePicker.jsx`.
6. **Budget Smart Mode** — `BudgetSlider.jsx` + client-side filtering/gray-out.
7. **Clarification Flow** — `is_vague()` + `get_clarification()` + `ClarificationBubble.jsx`.
8. **Multi-modal Fusion** — `/intent/fuse` + context stack + 🔗 Combine mode.

### Phase 6 — Reliability
- **Bedrock retry/backoff** for throttling in `bedrock_client.py`.
- **Batched reasoning** — all item reasons in ONE LLM call (`generate_reasons_batch`).
- **Rule-based fallback** — `_fallback_intent()` so the app works even when Bedrock is down.

### Phase 7 — UX polish
- **Live voice transcription** — words stream into the input + overlay; auto-submits on pause; error toasts for mic/permission issues.
- **Liquid glass theme** — animated background blobs, glassmorphism cards, gradient CTAs, smooth motion (`index.css`).
- **Add Your Own Item** — `/intent/search` endpoint + `AddItemSheet.jsx` (catalog search + custom item).
- **Wide responsive layout** — two-panel (`max-w-6xl`): controls left, items grid right, empty-state welcome card.

### Phase 8 — Docs cleanup
- Deleted all scattered `.md` files. Kept a single `README.md` + this `CLAUDE.md`.

### Phase 9 — Blinkit-style UI redesign
- New components: `ProductCard` (vertical card + qty stepper), `CategorySection`,
  `CartDrawer` (expandable sticky cart bar), `SkeletonGrid`, `IntentBadge`, `AISummaryBanner`.
- Home.jsx: **quantity map system** (`quantities` + `extraItems`), category-grouped product
  grid, order-success screen with countdown, "+ Add your own item".
- Deleted `CartCard.jsx` and `CartSummary.jsx` (replaced by ProductCard + CartDrawer).

### Phase 10 — Images + browse-first UX
- **Real product photos** — all 100 products use LoremFlickr URLs keyed by a product-specific
  keyword + per-product `lock` seed (distinct photos even within a category). Category-colored
  placeholder kept as `onError` fallback in `ProductCard`.
- **BrowsableHomeFeed** — replaces the old WelcomeCard empty state. Loads all 100 products via
  `/intent/search`, with horizontal category tabs and add-to-cart steppers.
- Deleted `WelcomeCard.jsx`; added `.no-scrollbar` utility to `index.css`.

### Phase 11 — Branding
- Added `frontend/public/logo.jpg` (copied from project root `logo.jpg`).
- Logo used in the header and as the favicon (`index.html`).

### Phase 12 — Header, images, suggestions, review cart
- Header rebranded to **UrbanRush** (cropped blue bolt from logo → `public/bolt.png`, "Urban" white + "Rush" blue, tagline "Life Moves Fast. We Move First.").
- Product visuals switched to **emoji icons on category-tinted tiles** (`utils/productImage.js`) — reliable + relevant (LoremFlickr returned irrelevant photos).
- **Live product suggestions** (`AutoSuggest.jsx`) — typing 2+ chars shows add-able catalog matches.
- **Instamart-style cart** — header cart pill opens `ReviewCart.jsx` top-right panel with steppers + Place Order; replaced the bottom `CartDrawer` (deleted).

### Phase 13 — Next-tier unique features
- **Feature A — Situational Memory** (`memory_engine.py`, `ReplayBanner.jsx`): records past situations, suggests "last time you ordered…" on a similar one. Responses include `replay_suggestion`.
- **Feature B — Live Thinking Stream** (`/intent/extract-stream` SSE, `ThinkingStream.jsx`): streams the AI's reasoning token-by-token, then emits the full cart. Falls back to a synthesized stream when Bedrock is down. Drives the main text-submit path.
- **Feature C — Cart Diff** (`previousCartIds` + `ProductCard isNew`): re-ranking via the scoring tuner highlights newly-surfaced items with a green NEW badge + ring.
- **Feature D — Judge Mode** (`JudgeMode.jsx`): a toggle that overlays technical labels on the Intent badge, confidence, bundle, recommendation grid, and scoring tuner.
- **Feature E — Crisis Triage** (`get_crisis_triage`, `/intent/refine`, `CrisisTriage.jsx`): for high-urgency emergency/baby_care, asks one triage question then rebuilds the cart from the augmented intent. Has a rule-based fallback so it works without Bedrock.
- Installed **Pillow** in the venv (dev-only) to crop the bolt; not used at runtime.

### Phase 14 — Personalization & buddy features
- **Real product photos** — `products.json` now uses curated real Unsplash photos by keyword (85/100); the rest fall back to the emoji tile. `ProductCard` shows the photo (object-cover) with emoji fallback on error.
- **Personal greeting** (`GreetingHeader.jsx`) — time-of-day + editable name (localStorage) + live weather/location via geolocation + wttr.in ("Good evening, Aman — rain expected tonight near Najafgarh").
- **Conversational follow-ups** (`get_followup` + `FollowUpQuestion.jsx`) — "guests coming" → asks how many; "something crunchy" → asks which. Answer patches the intent and rebuilds via `/intent/refine`. Cravings now bypass the vague-clarification path.
- **On-device personalization** (`utils/personalization.js`) — purchase history in localStorage drives a **"⭐ Your usual"** badge on repeat buys, **buddy reorder nudges** ("running low on the essentials?") in the empty state, and a price-preference signal. `recordPurchase` fires on checkout.
- Note: deep price-sensitivity learning and silent dietary filters are groundwork-only; voice uses the browser Web Speech API (Chrome/Edge + mic permission).

### Phase 15 — Predictive & longitudinal features
- **Mood → cart** (`_mood_intent`): "I'm sad / lazy / tired / sick" → comfort/recharge/emergency carts. Deterministic (no LLM).
- **Recipe → cart** (`_recipe_intent`): "make maggi for 4" → scaled ingredient list. Deterministic.
- **Consumption-rate depletion engine** (`personalization.js` SHELF_LIFE + `getDepletionAlerts`): predicts "milk runs out in ~1 day" from purchase timestamps; seeds demo history. Shown as a "🔮 Predicted to run out" nudge.
- **Weekly budget envelope** (`WeeklyEnvelope.jsx`): set ₹/week, spend tracked across orders in localStorage, shows remaining + per-day pace.
- **Regret-free checkout** (`RegretGuard.jsx`): 10s safety-net confirm for high-quantity items before ordering, with inline steppers.
- **Party mode** (`PartyMode.jsx` + `/intent/parse-items`): group voice cart — each person speaks, items are extracted from the catalog and deduped into one shared cart.
- **Substitution intelligence**: `/intent/alternatives` now returns a `_sub_reason` ("Closest snacks match · 4.5★ · ₹30") shown in `AlternativePicker`.
- Created **ARCHITECTURE.md** documenting the full system, pipeline, endpoints, feature map, and data shapes.

### Phase 16 — Per-user memory + onboarding + adaptive UI
- **`user_memory.py`** — per-user JSON profile (name, dietary, price tier, favorite categories, frequent items, situation history, preferred brands). Endpoints: `/intent/profile` (POST/GET), `/intent/scenarios/{user_id}`, `/intent/preference`.
- **WelcomeOnboarding** — first-launch name + dietary capture; feeds the profile.
- **Silent dietary filter** + **"Your usual"** marks applied server-side in `_apply_profile`.
- **Adaptive scenario chips** — reordered by time-of-day + the user's history.
- `user_id` is sent on every request (`getUserId()` in api.js); `data/user_memory/` gitignored.

### Phase 17 — AI Copilot dashboard redesign
- Light **blue glass header** (`glass-blue`) with logo + "AI Copilot Active" pill + 10-min badge + Panic + cart pill + avatar.
- Left "**AI Copilot / What happened?**" card; scrollable sticky sidebar so the **Memory Orbit** is reachable.
- New visual components: **AiPredictions** strip, **MemoryOrbit**, **AskBubble** (floating), warmer empty states.
- **Judge Mode removed** (toggle deleted).

### Phase 18 — Quantity-per-person + switch & preference memory
- Cart loads scale consumable quantities by `people_count`.
- **⇄ Switch** on each product card → popover of alternatives → swaps via a `replacements` map (no quantity reset). Choice saved as a **brand preference** (`/intent/preference`) and re-applied to future carts in `_apply_profile`.

### Phase 19 — Images, hosting, docs
- More product photos added (name-based images mapped to IDs; webp/avif → jpg). Card images use `object-contain` on white. Image chain: `/products/<ID>.jpg` → online → emoji.
- Frontend API base is configurable via `VITE_API_BASE` (for deployment).
- New docs: **PRD.md**, **DEMO_SCRIPT.md**, **DEPLOYMENT.md**.

---

## 📊 Current State

- **Backend:** ✅ Working. All endpoints functional and tested (`/health`, `/intent/extract`,
  `/panic`, `/analyze-image`, `/fuse`, `/alternatives`, `/search`).
- **Frontend:** ✅ Builds clean (no warnings). Blinkit-style product grid with quantity
  steppers, category sections, expandable cart drawer, browse-first home feed, real product
  photos, and the project logo in the header/favicon. All features integrated.
- **AWS Bedrock:** ⚠️ Blocked on **account billing** — `INVALID_PAYMENT_INSTRUMENT`. A valid
  payment method must be added in the AWS Console (Billing → Payment preferences) and
  Bedrock model access enabled in `ap-south-1`.
- **Demo mode:** ✅ Active fallback — rule-based intent keeps the app fully usable for demos
  while billing is pending. Switches to real Claude automatically once Bedrock is reachable.

### Servers (local dev)
- Frontend: `npm run dev` → http://localhost:5173/
- Backend: `venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000`

---

## ⚠️ Known Issues / TODO

- [ ] **AWS billing** — add valid payment instrument to enable real Claude responses.
- [ ] **Vision (camera) feature** needs Bedrock; falls back to error if unavailable.
- [ ] Voice input is Chrome/Edge only (Web Speech API limitation).
- [ ] Cart total in summary reflects the full cart; budget filter is visual-only.

---

## 🔑 Key Implementation Notes

- **`recommend()`** appends a carrier object `{"__bundle_meta": True, ...}` to the products
  list; the router's `_finalize_cart()` pops it before `build_cart()`.
- **Injected bundle items** carry `_injected: True` and a computed `_score`.
- **Manually added items** carry `_added`/`_custom`; custom items get `id = CUSTOM-<ts>`.
- **Fallback intent** sets `_demo_mode: True` on the intent.
- **Manually added items** carry `_added`/`_custom`; **swapped** carry `_swapped`;
  **bundle-injected** carry `_injected`. Browse/manual items live in Home's `extraItems`
  state and merge with `cart.items` for the grid + drawer.
- **Product images:** stored as LoremFlickr URLs in `products.json`
  (`https://loremflickr.com/320/320/<keyword>?lock=<id-number>`). `ProductCard.getPlaceholder()`
  generates the category-colored fallback tile.
- **Logo:** `frontend/public/logo.jpg` → served at `/logo.jpg`.
- **Model ID gotcha:** on-demand Claude 3.5 v2 requires the regional inference-profile ID
  (`apac.…`), not the bare `anthropic.…` ID — otherwise `ValidationException`.
