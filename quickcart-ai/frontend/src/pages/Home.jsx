import { useState, useEffect, useRef, useMemo } from "react";
import ScenarioChips from "../components/ScenarioChips";
import VoiceButton from "../components/VoiceButton";
import CameraButton from "../components/CameraButton";
import PanicButton from "../components/PanicButton";
import ScoringTuner from "../components/ScoringTuner";
import BundleInsightBanner from "../components/BundleInsightBanner";
import AlternativePicker from "../components/AlternativePicker";
import BudgetSlider from "../components/BudgetSlider";
import ClarificationBubble from "../components/ClarificationBubble";
import AddItemSheet from "../components/AddItemSheet";
import ProductCard from "../components/ProductCard";
import CategorySection from "../components/CategorySection";
import BrowsableHomeFeed from "../components/BrowsableHomeFeed";
import SkeletonGrid from "../components/SkeletonGrid";
import ReviewCart from "../components/ReviewCart";
import AutoSuggest from "../components/AutoSuggest";
import IntentBadge from "../components/IntentBadge";
import AISummaryBanner from "../components/AISummaryBanner";
import ReplayBanner from "../components/ReplayBanner";
import ThinkingStream from "../components/ThinkingStream";
import CrisisTriage from "../components/CrisisTriage";
import FollowUpQuestion from "../components/FollowUpQuestion";
import GreetingHeader from "../components/GreetingHeader";
import WelcomeOnboarding from "../components/WelcomeOnboarding";
import RegretGuard from "../components/RegretGuard";
import PartyMode from "../components/PartyMode";
import WeeklyEnvelope from "../components/WeeklyEnvelope";
import AiPredictions from "../components/AiPredictions";
import KitsRow from "../components/KitsRow";
import MemoryOrbit from "../components/MemoryOrbit";
import AskBubble from "../components/AskBubble";
import { JudgeModeToggle, JudgeAnnotation } from "../components/JudgeMode";
import {
  getUsualIds, recordPurchase, getReorderNudges,
  seedDemoHistory, getDepletionAlerts, addWeeklySpend, getUserName,
} from "../utils/personalization";
import { extractIntent, fuseIntent, savePreference } from "../utils/api";

const CATEGORY_LABELS = {
  snacks: "🍿 Snacks", beverages: "🥤 Drinks", dairy: "🥛 Dairy", bakery: "🍞 Bakery",
  baby: "👶 Baby Care", emergency: "⚡ Emergency", personal_care: "🧴 Personal Care",
  stationery: "📚 Stationery", cleaning: "🧹 Cleaning", kitchen: "🍳 Kitchen",
  electronics: "🔌 Electronics", general: "🛒 Other",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState(null);
  const [cart, setCart] = useState(null);
  const [ordered, setOrdered] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showTuner, setShowTuner] = useState(false);
  const [scoringWeights, setScoringWeights] = useState({});
  const [sceneDescription, setSceneDescription] = useState(null);
  const [timeSaved, setTimeSaved] = useState(0);

  const [removedItem, setRemovedItem] = useState(null);
  const [budget, setBudget] = useState(null);
  const [showBudget, setShowBudget] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [contextStack, setContextStack] = useState([]);
  const [combineMode, setCombineMode] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // Blinkit-style quantity system
  const [quantities, setQuantities] = useState({});
  const [extraItems, setExtraItems] = useState([]); // user-added + swapped items
  const [replacements, setReplacements] = useState({}); // oldId -> chosen alternative
  const [showReview, setShowReview] = useState(false); // Instamart-style cart panel
  const [showSuggest, setShowSuggest] = useState(false); // live product suggestions
  // New unique features
  const [replay, setReplay] = useState(null);          // Feature A
  const [triage, setTriage] = useState(null);          // Feature E
  const [judgeMode, setJudgeMode] = useState(false);   // Feature D
  const [streaming, setStreaming] = useState(false);   // Feature B
  const [streamQuery, setStreamQuery] = useState("");
  const [previousCartIds, setPreviousCartIds] = useState([]); // Feature C
  const [followup, setFollowup] = useState(null);             // conversational follow-up
  const [usualIds, setUsualIds] = useState(new Set());        // personalization
  const [reorderNudges, setReorderNudges] = useState([]);     // buddy nudges
  const [depletion, setDepletion] = useState([]);             // depletion engine
  const [showParty, setShowParty] = useState(false);          // group voice cart
  const [regretOpen, setRegretOpen] = useState(false);        // regret-free checkout
  const [riskyItems, setRiskyItems] = useState([]);
  const [envelopeKey, setEnvelopeKey] = useState(0);          // weekly budget refresh
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem("qc_onboarded"));
  const [greetKey, setGreetKey] = useState(0);
  const [deliveryCity, setDeliveryCity] = useState("Detecting location…");

  useEffect(() => {
    seedDemoHistory();
    setUsualIds(getUsualIds());
    setReorderNudges(getReorderNudges());
    setDepletion(getDepletionAlerts());
  }, []);

  const countdownRef = useRef(null);

  // All items shown in the grid = AI cart items + user extras, with manual switches applied
  const allItems = useMemo(() => {
    const apply = (it) => replacements[it.id] || it;
    const merged = [...(cart?.items || []).map(apply), ...extraItems.map(apply)];
    const seen = new Set();
    const out = [];
    for (const it of merged) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  }, [cart, extraItems, replacements]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    allItems.forEach((item) => {
      const label = CATEGORY_LABELS[item.category] || "🛒 Other";
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [allItems]);

  const selectedTotal = useMemo(
    () => allItems.reduce((s, i) => s + i.price_inr * (quantities[i.id] || 0), 0),
    [allItems, quantities]
  );
  const totalQty = useMemo(
    () => Object.values(quantities).reduce((a, b) => a + b, 0),
    [quantities]
  );
  const budgetRemaining = budget != null ? budget - selectedTotal : null;

  // When a NEW cart loads from the API, init quantities (scaled by people) + reset extras
  useEffect(() => {
    if (cart?.items) {
      const people = Math.min(Math.max(intent?.people_count || 1, 1), 8);
      const CONSUMABLE = new Set(["snacks", "beverages", "bakery", "dairy"]);
      const initial = {};
      cart.items.forEach((item) => {
        initial[item.id] = CONSUMABLE.has(item.category) ? people : 1;
      });
      setQuantities(initial);
      setExtraItems([]);
      setReplacements({});
    }
  }, [cart]);

  // Animated "time saved" counter
  useEffect(() => {
    if (!cart?.time_saved_sec) return;
    setTimeSaved(0);
    const target = cart.time_saved_sec;
    const step = Math.max(1, Math.round(target / 40));
    const id = setInterval(() => {
      setTimeSaved((t) => {
        if (t + step >= target) {
          clearInterval(id);
          return target;
        }
        return t + step;
      });
    }, 25);
    return () => clearInterval(id);
  }, [cart]);

  useEffect(() => () => clearInterval(countdownRef.current), []);

  // ---------- input handlers ----------
  const applyResult = (data) => {
    if (data.needs_clarification) {
      setIntent(data.intent);
      setClarification(data.clarification);
    } else {
      setIntent(data.intent);
      setCart(data.cart);
      setReplay(data.replay_suggestion || null);
      setTriage(data.triage || null);
      setFollowup(data.followup || null);
      setTimeout(() => narrateCart(data.cart, data.intent), 400);
    }
  };

  // Non-streaming fallback (used if the stream errors)
  const runExtract = async (query) => {
    setLoading(true);
    try {
      const { data } = await extractIntent(query, scoringWeights);
      applyResult(data);
    } catch (e) {
      alert("Error connecting to backend. Is it running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  // Feature B: kick off streaming reasoning; ThinkingStream drives the result
  const soloSubmit = (query) => {
    setInput(query);
    setOrdered(false);
    setSceneDescription(null);
    setClarification(null);
    setCart(null);
    setReplay(null);
    setTriage(null);
    setFollowup(null);
    setPreviousCartIds([]);
    setStreamQuery(query);
    setStreaming(true);
    setLoading(true);
  };

  const handleStreamComplete = (data) => {
    setStreaming(false);
    setLoading(false);
    if (!data || data.error) {
      runExtract(streamQuery);
      return;
    }
    applyResult(data);
  };

  const handleSubmit = (text, forceSolo = false) => {
    const query = (text ?? input).trim();
    if (!query) return;
    if (combineMode && !forceSolo) {
      addToStack("text", query);
      setInput("");
      return;
    }
    soloSubmit(query);
  };

  const handleVoice = (transcript) => {
    if (combineMode) {
      addToStack("voice", transcript);
      setInput(transcript);
    } else {
      handleSubmit(transcript, true);
    }
  };

  const handleCamera = (data) => {
    const scene = data.scene_description || "photo";
    if (combineMode) {
      addToStack("image", "photo", { scene });
    } else {
      setSceneDescription(data.scene_description || null);
      setIntent(data.intent);
      setCart(data.cart);
      setReplay(data.replay_suggestion || null);
      setTriage(null);
      setOrdered(false);
      setClarification(null);
      setTimeout(() => narrateCart(data.cart, data.intent), 400);
    }
  };

  const handlePanic = (data) => {
    setIntent(data.intent);
    setCart(data.cart);
    setReplay(data.replay_suggestion || null);
    setTriage(null);
    setInput("");
    setOrdered(false);
    setSceneDescription(null);
    setClarification(null);
    setTimeout(() => narrateCart(data.cart, data.intent), 400);
  };

  const handleClarificationAnswer = (answer) => {
    setClarification(null);
    soloSubmit(answer);
  };

  const addToStack = (type, value, extra = {}) =>
    setContextStack((prev) => [...prev, { type, value, ...extra }]);

  const handleFusedSubmit = async () => {
    if (contextStack.length === 0) return;
    setLoading(true);
    setClarification(null);
    setCart(null);
    try {
      const { data } = await fuseIntent(contextStack);
      setIntent(data.intent);
      setCart(data.cart);
      setReplay(data.replay_suggestion || null);
      setContextStack([]);
      setCombineMode(false);
      setTimeout(() => narrateCart(data.cart, data.intent), 400);
    } catch (e) {
      alert("Fusion error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- quantity handlers ----------
  const handleAdd = (item) => {
    setRemovedItem(null);
    // Track browse-added / new items so they appear in the cart drawer
    setExtraItems((prev) => {
      const inCart = (cart?.items || []).some((i) => i.id === item.id);
      if (inCart || prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setQuantities((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  const handleDecrease = (item) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if ((next[item.id] || 0) <= 1) {
        delete next[item.id];
        setRemovedItem(item); // offer alternatives
      } else {
        next[item.id] -= 1;
      }
      return next;
    });
  };

  // Switch an item to a chosen alternative + remember the preference
  const handleSwitch = (oldItem, newItem) => {
    const repl = { ...newItem, _swapped: true, _score: oldItem._score ?? newItem._score ?? 0.7 };
    setReplacements((prev) => ({ ...prev, [oldItem.id]: repl }));
    setQuantities((prev) => {
      const n = { ...prev };
      const q = n[oldItem.id] || 1;
      delete n[oldItem.id];
      n[repl.id] = q;
      return n;
    });
    if (oldItem.category) savePreference(oldItem.category, newItem.id).catch(() => {});
  };

  // Manual add from AddItemSheet (catalog search or custom)
  const handleAddItem = (item) => {
    setExtraItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
    setQuantities((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  // Quantity adjuster for the regret-guard modal (no alternatives trigger)
  const adjustQty = (item, delta) => {
    setQuantities((prev) => {
      const n = { ...prev };
      const q = (n[item.id] || 0) + delta;
      if (q <= 0) delete n[item.id];
      else n[item.id] = q;
      return n;
    });
  };

  // Swap from AlternativePicker
  const handleSwap = (newItem) => {
    const swapped = { ...newItem, _swapped: true };
    setExtraItems((prev) => (prev.some((i) => i.id === swapped.id) ? prev : [...prev, swapped]));
    setQuantities((prev) => ({ ...prev, [swapped.id]: 1 }));
    setRemovedItem(null);
  };

  const handleWeightsChange = async (newWeights) => {
    setScoringWeights(newWeights);
    if (input.trim() && !loading && cart) {
      setPreviousCartIds(cart.items.map((i) => i.id)); // Feature C: snapshot before re-rank
      setLoading(true);
      try {
        const { data } = await extractIntent(input, newWeights);
        if (!data.needs_clarification) {
          setIntent(data.intent);
          setCart(data.cart);
        }
      } catch (e) {
        console.error("Re-rank failed", e);
      } finally {
        setLoading(false);
      }
      setTimeout(() => setPreviousCartIds([]), 2500); // clear NEW badges after a beat
    }
  };

  const doOrder = () => {
    const bought = allItems.filter((i) => (quantities[i.id] || 0) > 0);
    recordPurchase(bought);
    addWeeklySpend(selectedTotal);
    setUsualIds(getUsualIds());
    setReorderNudges(getReorderNudges());
    setDepletion(getDepletionAlerts());
    setEnvelopeKey((k) => k + 1);

    setRegretOpen(false);
    setShowReview(false);
    setOrdered(true);
    setCountdown(10);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);
  };

  const handleCheckout = () => {
    // Regret-free: if any item has a high/ambiguous quantity, confirm first
    const risky = allItems.filter((i) => (quantities[i.id] || 0) >= 2);
    if (risky.length > 0) {
      setRiskyItems(risky);
      setShowReview(false);
      setRegretOpen(true);
      return;
    }
    doOrder();
  };

  const startNewOrder = () => {
    setOrdered(false);
    setCart(null);
    setIntent(null);
    setQuantities({});
    setExtraItems([]);
    setInput("");
    setClarification(null);
    setSceneDescription(null);
  };

  const narrateCart = (cartData, intentData) => {
    if (!window.speechSynthesis || !cartData?.items) return;
    window.speechSynthesis.cancel();
    const topItems = cartData.items
      .slice(0, 3)
      .map((i) => i.name.split(" ").slice(0, 3).join(" "))
      .join(", ");
    const moreCount = cartData.item_count - 3;
    const more = moreCount > 0 ? ` and ${moreCount} more items` : "";
    const occasion = intentData?.occasion?.replace(/_/g, " ") || "your situation";
    const text = `For ${occasion}, I've selected ${topItems}${more}. Total ₹${cartData.total_inr}, arriving in ${cartData.estimated_delivery_min} minutes.`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  const fmtTimeSaved = (s) => `${Math.floor(s / 60)} min ${(s % 60).toString().padStart(2, "0")} sec`;
  const hasOutput = loading || clarification || cart || streaming;

  return (
    <div className="min-h-screen pb-12 relative z-10">
      {/* First-launch onboarding */}
      {showOnboarding && (
        <WelcomeOnboarding
          onComplete={() => {
            setShowOnboarding(false);
            setGreetKey((k) => k + 1);
            setDepletion(getDepletionAlerts());
          }}
        />
      )}

      {/* Liquid animated background */}
      <div className="bg-liquid">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      {/* HEADER — floating rounded glass bar */}
      <header className="sticky top-2 z-40 px-3">
        <div className="max-w-6xl mx-auto glass-blue rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-md ring-1 ring-blue-100 overflow-hidden">
              <img src="/bolt.png?v=2" alt="UrbanRush bolt" className="h-8 w-8 object-contain" />
            </span>
            <div className="leading-tight">
              <span className="font-extrabold text-xl tracking-tight">
                <span className="text-slate-800">Urban</span>
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  Rush
                </span>
              </span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Life Moves Fast. We Move First.</p>
            </div>
          </div>
          {/* Center: AI Copilot status */}
          <span className="hidden md:inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="text-sky-500">✦</span> AI Copilot Active
          </span>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-green-500/30">
              ⚡ 10 min delivery
            </span>
            <PanicButton onCartBuilt={handlePanic} onLoading={setLoading} />
            {!ordered && totalQty > 0 && (
              <button
                onClick={() => setShowReview((v) => !v)}
                className="flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-3 py-2 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                <span className="relative">
                  🛒
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalQty}
                  </span>
                </span>
                <span>₹{selectedTotal.toFixed(0)}</span>
              </button>
            )}
            {/* User avatar */}
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {(getUserName()[0] || "U").toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* PERSONAL GREETING */}
      <div className="max-w-6xl mx-auto px-4 mt-3">
        <GreetingHeader key={greetKey} onLocation={setDeliveryCity} />
      </div>

      {/* MAIN GRID */}
      <main className="max-w-6xl mx-auto px-4 mt-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============ LEFT PANEL ============ */}
        <section className="lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto no-scrollbar space-y-3">
          <div className="glass rounded-3xl p-4 shine">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-blue-500">✦</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">AI Copilot</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 leading-tight">What happened?</h2>
            <p className="text-xs text-slate-500 mb-3">Describe your situation — UrbanRush predicts what you'll need.</p>

            {/* Context stack */}
            {contextStack.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 items-center">
                {contextStack.map((ctx, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    <span>{ctx.type === "voice" ? "🎙" : ctx.type === "image" ? "📷" : "✏️"}</span>
                    <span className="max-w-28 truncate">
                      {ctx.type === "image" ? ctx.scene || "photo" : ctx.value}
                    </span>
                    <button
                      onClick={() => setContextStack((p) => p.filter((_, j) => j !== i))}
                      className="text-blue-400 hover:text-red-500 ml-0.5"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleFusedSubmit}
                  className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-blue-700 transition-all"
                >
                  Build cart from all ↗
                </button>
                <button onClick={() => setContextStack([])} className="text-xs text-gray-400 hover:text-red-400">
                  Clear
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="relative">
              <div className="flex gap-2">
                <input
                  id="situation-input"
                  className="flex-1 min-w-0 h-14 bg-white/70 border-2 border-white/60 focus:border-blue-400 rounded-2xl px-4 text-base outline-none transition-all placeholder:text-slate-400"
                  placeholder='Describe your situation — "guests in 30 mins"'
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowSuggest(false);
                      handleSubmit();
                    } else if (e.key === "Escape") {
                      setShowSuggest(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setShowSuggest(false);
                    handleSubmit();
                  }}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white px-6 h-14 rounded-2xl font-semibold transition-all disabled:opacity-50 flex-shrink-0 shadow-lg shadow-blue-500/30 active:scale-95"
                >
                  {loading ? "..." : combineMode ? "Add" : "Go"}
                </button>
              </div>

              {/* Live product suggestions */}
              {showSuggest && input.trim().length >= 2 && (
                <AutoSuggest
                  query={input}
                  quantities={quantities}
                  onAdd={handleAdd}
                  onClose={() => setShowSuggest(false)}
                />
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 mt-2">
              <VoiceButton onResult={handleVoice} onInterim={(t) => setInput(t)} />
              <CameraButton onResult={handleCamera} onLoading={setLoading} />
              <button
                onClick={() => setCombineMode((v) => !v)}
                className={`flex-1 text-xs font-medium px-3 py-2.5 rounded-2xl transition-all border ${
                  combineMode
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white/60 text-slate-500 border-white/60 hover:text-blue-600"
                }`}
              >
                🔗 {combineMode ? "Combining — add voice / photo / text" : "Combine inputs"}
              </button>
            </div>

            {/* Party mode launcher */}
            <button
              onClick={() => setShowParty(true)}
              className="w-full mt-2 text-xs font-medium px-3 py-2.5 rounded-2xl bg-white/60 text-slate-500 border border-white/60 hover:text-pink-600 hover:border-pink-300 transition-all"
            >
              🎉 Party mode — everyone adds by voice
            </button>

            <ScenarioChips onSelect={(t) => handleSubmit(t, true)} />

            <JudgeAnnotation active={judgeMode} label="Recommendation Engine — live weights">
              <ScoringTuner open={showTuner} onToggle={() => setShowTuner((v) => !v)} onWeightsChange={handleWeightsChange} />
            </JudgeAnnotation>

            {/* Budget envelope (weekly, across orders) */}
            <div className="mt-3 pt-3 border-t border-white/40">
              <WeeklyEnvelope refreshKey={envelopeKey} />
            </div>

            {/* Budget */}
            {cart && !ordered && (
              <button
                onClick={() => {
                  setShowBudget((b) => !b);
                  if (!showBudget && !budget) setBudget(500);
                }}
                className="mt-2 text-xs text-blue-600 font-medium hover:underline"
              >
                {showBudget ? "▲ Hide budget filter" : "₹ Set budget"}
              </button>
            )}
            {showBudget && cart && (
              <div className="mt-2">
                <BudgetSlider budget={budget || 500} onChange={setBudget} />
                {budgetRemaining != null && (
                  <div className="mt-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        budgetRemaining >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {budgetRemaining >= 0
                        ? `₹${budgetRemaining} under budget`
                        : `₹${Math.abs(budgetRemaining)} over budget`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Memory Orbit */}
          <MemoryOrbit />

          {/* Panic context banner */}
          {intent?.source === "panic_mode" && cart && !ordered && (
            <div className="glass-dark rounded-2xl px-4 py-3">
              <p className="text-xs text-slate-400 mb-0.5">⚡ AI read your context</p>
              <p className="text-sm text-white font-medium">{intent.situation}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {new Date().getHours()}:00 hrs
                </span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                  {intent.occasion?.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ============ RIGHT PANEL ============ */}
        <section className="lg:col-span-8 min-h-[300px]">
          {/* Order success */}
          {ordered && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
              <p className="text-gray-500 text-sm mb-6">Your items are on the way</p>
              <div className="glass rounded-2xl px-8 py-5 text-center">
                <p className="text-5xl font-bold text-blue-600 font-mono">{countdown}</p>
                <p className="text-sm text-gray-500 mt-1">minutes remaining</p>
              </div>
              <button onClick={startNewOrder} className="mt-6 text-blue-600 text-sm font-medium hover:underline">
                Start new order →
              </button>
            </div>
          )}

          {/* Empty state */}
          {!ordered && !hasOutput && (
            <>
              <AiPredictions
                depletion={depletion}
                weather={deliveryCity}
                onQuery={(q) => handleSubmit(q, true)}
                onAddItem={handleAdd}
              />
              {depletion.length > 0 && (
                <div className="mb-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-2xl px-4 py-3 animate-slide-in">
                  <p className="text-sm font-semibold text-amber-900">
                    🔮 Predicted to run out soon
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {depletion.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleAdd({ id: n.id, name: n.name, category: n.category, price_inr: n.price, image_url: n.image_url, _score: 0.8 })}
                        className="flex items-center gap-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-full px-3 py-1.5 hover:bg-amber-500 hover:text-white transition-all"
                      >
                        {n.name.split(" ").slice(0, 2).join(" ")} ·{" "}
                        {n.daysLeft === 0 ? "today" : `~${n.daysLeft}d left`} · reorder
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {depletion.length === 0 && reorderNudges.length > 0 && (
                <div className="mb-3 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-2xl px-4 py-3 animate-slide-in">
                  <p className="text-sm font-semibold text-emerald-900">👋 Running low on the essentials?</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {reorderNudges.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleAdd({ id: n.id, name: n.name, category: n.category, price_inr: n.price, image_url: n.image_url, _score: 0.7 })}
                        className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 text-xs font-medium rounded-full px-3 py-1.5 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        🔁 {n.name.split(" ").slice(0, 2).join(" ")} · add again
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <BrowsableHomeFeed quantities={quantities} usualIds={usualIds} onAdd={handleAdd} onRemove={handleDecrease} />
            </>
          )}

          {/* Feature B: live AI reasoning stream (replaces spinner) */}
          {!ordered && streaming && (
            <ThinkingStream
              userInput={streamQuery}
              weights={scoringWeights}
              active={streaming}
              onComplete={handleStreamComplete}
            />
          )}

          {/* Loading (non-stream paths: re-rank, panic, camera) */}
          {!ordered && loading && !streaming && <SkeletonGrid />}

          {/* Clarification */}
          {!ordered && !streaming && clarification && !cart && (
            <div className="glass rounded-3xl p-4">
              <ClarificationBubble clarification={clarification} onAnswer={handleClarificationAnswer} />
            </div>
          )}

          {/* Cart content */}
          {!ordered && cart && !loading && !streaming && (
            <>
              {/* Feature A: situational memory */}
              <ReplayBanner
                suggestion={replay}
                onAccept={() => setReplay(null)}
                onDismiss={() => setReplay(null)}
              />

              {/* Feature E: crisis triage */}
              <CrisisTriage
                triage={triage}
                currentIntent={intent}
                onResolved={(newIntent, newCart) => {
                  setIntent(newIntent);
                  setCart(newCart);
                  setTriage(null);
                }}
              />

              {/* Conversational follow-up */}
              <FollowUpQuestion
                followup={followup}
                currentIntent={intent}
                onResolved={(newIntent, newCart) => {
                  setIntent(newIntent);
                  setCart(newCart);
                  setFollowup(null);
                }}
                onDismiss={() => setFollowup(null)}
              />

              <JudgeAnnotation active={judgeMode} label="Intent Engine → Claude 3.5 Sonnet">
                <IntentBadge intent={intent} confidence={cart.confidence} confidenceLabel={cart.confidence_label} />
              </JudgeAnnotation>

              {sceneDescription && (
                <div className="mb-3 glass rounded-2xl px-4 py-3 border-l-4 border-l-blue-400">
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">📷 AI saw in your photo</p>
                  <p className="text-sm text-slate-700 mt-0.5">{sceneDescription}</p>
                </div>
              )}

              <JudgeAnnotation active={judgeMode} label={`Confidence = avg(_score) → ${cart.confidence}%`}>
                <AISummaryBanner summary={cart.ai_summary} timeSaved={`You saved ${fmtTimeSaved(timeSaved)} vs traditional search`} />
              </JudgeAnnotation>

              {cart.bundle_insights?.length > 0 && (
                <JudgeAnnotation active={judgeMode} label={`Bundle Engine → filled ${cart.gaps_filled} gap(s)`}>
                  <div className="mb-3">
                    <BundleInsightBanner insights={cart.bundle_insights} gapsFilled={cart.gaps_filled} />
                  </div>
                </JudgeAnnotation>
              )}

              {cart.fused_from > 1 && (
                <span className="inline-block mb-3 text-xs bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-700 px-3 py-1 rounded-full font-medium">
                  ✦ Fused from {cart.fused_from} inputs
                </span>
              )}

              {/* AI Generated Cart header */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✦</span>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">AI Generated Cart</h3>
                    <p className="text-xs text-slate-400">Handpicked for your situation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReview(true)}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-all"
                >
                  ✎ Edit Cart
                </button>
              </div>

              {/* Kit cards — themed bundles */}
              <KitsRow groups={groupedItems} intent={intent} onEdit={() => setShowReview(true)} />

              {/* Priority legend */}
              <div className="flex gap-4 mb-4 items-center px-1">
                <span className="text-xs text-gray-400 font-medium">Priority:</span>
                {[
                  { dot: "bg-red-500", label: "Critical" },
                  { dot: "bg-yellow-400", label: "Helpful" },
                  { dot: "bg-green-400", label: "Nice to have" },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Category sections */}
              <JudgeAnnotation active={judgeMode} label="Recommendation + Cart Optimizer">
                <div>
                  {Object.entries(groupedItems).map(([label, items]) => (
                    <CategorySection
                      key={label}
                      label={label}
                      items={items}
                      intent={intent}
                      quantities={quantities}
                      budget={budget}
                      previousCartIds={previousCartIds}
                      usualIds={usualIds}
                      onAdd={handleAdd}
                      onRemove={handleDecrease}
                      onSwitch={handleSwitch}
                      excludeIds={allItems.map((i) => i.id)}
                    />
                  ))}
                </div>
              </JudgeAnnotation>

              {/* Alternatives */}
              {removedItem && (
                <div className="mb-4">
                  <AlternativePicker
                    removedItem={removedItem}
                    cartItems={allItems}
                    intent={intent}
                    onSwap={handleSwap}
                    onDismiss={() => setRemovedItem(null)}
                  />
                </div>
              )}

              {/* Add your own item */}
              <button
                onClick={() => setShowAddItem(true)}
                className="w-full py-3.5 mb-4 rounded-2xl border-2 border-dashed border-blue-300/70 text-blue-600 text-sm font-semibold
                           hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">＋</span> Add your own item
              </button>
            </>
          )}
        </section>
      </main>

      {/* CART — Instamart-style review panel */}
      {!ordered && (
        <ReviewCart
          open={showReview}
          allItems={allItems}
          quantities={quantities}
          onAdd={handleAdd}
          onRemove={handleDecrease}
          onCheckout={handleCheckout}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Add item sheet */}
      <AddItemSheet
        open={showAddItem}
        existingIds={allItems.map((i) => i.id)}
        onAdd={handleAddItem}
        onClose={() => setShowAddItem(false)}
      />

      {/* Regret-free checkout safety net */}
      <RegretGuard
        open={regretOpen}
        items={riskyItems}
        quantities={quantities}
        onConfirm={doOrder}
        onCancel={() => {
          setRegretOpen(false);
          setShowReview(true);
        }}
        onAdjust={adjustQty}
      />

      {/* Party mode — group voice cart */}
      <PartyMode open={showParty} onClose={() => setShowParty(false)} onAdd={handleAdd} quantities={quantities} />

      {/* Floating Ask UrbanRush */}
      <AskBubble
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => document.getElementById("situation-input")?.focus(), 300);
        }}
      />
    </div>
  );
}
