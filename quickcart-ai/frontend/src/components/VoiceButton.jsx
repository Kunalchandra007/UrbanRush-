import { useState, useRef, useEffect } from "react";

export default function VoiceButton({ onResult, onInterim }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const latestRef = useRef("");   // accumulates full transcript across restarts
  const firedRef = useRef(false); // ensure we only submit once per session
  const shouldRestartRef = useRef(false); // continuous-mode restart flag
  const silenceTimerRef = useRef(null);  // auto-submit after prolonged silence

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      clearTimeout(silenceTimerRef.current);
      if (recRef.current) {
        try { recRef.current.abort(); } catch { /* noop */ }
      }
    };
  }, []);

  // Commit whatever we have and fire onResult
  const commit = () => {
    shouldRestartRef.current = false;
    clearTimeout(silenceTimerRef.current);
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
    }
    // onend will fire onResult
  };

  const startListening = () => {
    if (listening) {
      commit();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    latestRef.current = "";
    firedRef.current = false;
    shouldRestartRef.current = true;
    setLiveText("");
    setError("");

    const createRec = () => {
      const rec = new SpeechRecognition();
      recRef.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = true;
      // continuous=true keeps it alive through pauses;
      // we manually restart on onend to work around the 60-second browser cap
      rec.continuous = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => setListening(true);

      rec.onresult = (e) => {
        // Build full transcript: previous accumulated + all results in this session
        let sessionText = "";
        for (let i = 0; i < e.results.length; i++) {
          sessionText += e.results[i][0].transcript;
        }
        const full = (latestRef.current + " " + sessionText).trim();
        setLiveText(full);
        if (onInterim) onInterim(full);

        // Save the final (non-interim) parts into latestRef so restarts keep context
        let finalText = "";
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        }
        if (finalText) {
          latestRef.current = (latestRef.current + " " + finalText).trim();
        }

        // Reset the silence timer — if user stops speaking for 3s, auto-submit
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          commit();
        }, 3000);
      };

      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          shouldRestartRef.current = false;
          setListening(false);
          setError("Microphone blocked. Allow mic access in your browser and try again.");
        } else if (e.error === "audio-capture") {
          shouldRestartRef.current = false;
          setListening(false);
          setError("No microphone found. Check your device.");
        } else if (e.error === "network") {
          shouldRestartRef.current = false;
          setListening(false);
          setError("Voice needs Google's speech service. Use Chrome or Edge — Brave/Firefox block it.");
        } else if (e.error === "no-speech") {
          // no-speech is common — just restart silently, don't show error
        }
        // aborted = we stopped it intentionally, ignore
      };

      rec.onend = () => {
        // Restart automatically to overcome the browser's ~60s session cap
        // and to survive brief no-speech gaps
        if (shouldRestartRef.current) {
          try {
            rec.start();
          } catch {
            // If start() fails (race condition), create a fresh instance
            setTimeout(() => {
              if (shouldRestartRef.current) createRec().start();
            }, 100);
          }
          return;
        }

        // Session ended intentionally — fire the result
        setListening(false);
        clearTimeout(silenceTimerRef.current);
        const result = latestRef.current.trim();
        if (result && !firedRef.current) {
          firedRef.current = true;
          onResult(result);
        }
        setLiveText("");
      };

      return rec;
    };

    try {
      createRec().start();
    } catch {
      setListening(false);
      shouldRestartRef.current = false;
    }
  };

  return (
    <>
      <button
        onClick={startListening}
        className={`p-3 rounded-full border-2 transition-all flex-shrink-0 ${
          listening
            ? "bg-red-50 border-red-400 text-red-500 pulse-ring"
            : "bg-white border-gray-200 text-gray-400 hover:border-blue-400"
        }`}
        title={listening ? "Tap to stop" : "Speak your situation"}
      >
        🎙
      </button>

      {/* Inline error toast */}
      {error && (
        <div
          className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 cursor-pointer"
          onClick={() => setError("")}
        >
          <div className="bg-red-500 text-white text-sm px-4 py-2 rounded-xl shadow-lg max-w-md">
            ⚠ {error}
          </div>
        </div>
      )}

      {/* Live listening overlay — shows words as you speak */}
      {listening && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-end gap-0.5 h-4">
                  <span className="voice-bar" style={{ animationDelay: "0s" }} />
                  <span className="voice-bar" style={{ animationDelay: "0.15s" }} />
                  <span className="voice-bar" style={{ animationDelay: "0.3s" }} />
                  <span className="voice-bar" style={{ animationDelay: "0.45s" }} />
                </div>
                <span className="text-xs font-semibold text-red-300">Listening… speak freely, tap Done when finished</span>
              </div>
              <button
                onClick={commit}
                className="text-xs bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full font-semibold"
              >
                Done
              </button>
            </div>
            <p className="text-sm leading-relaxed min-h-[1.25rem]">
              {liveText ? (
                <span>{liveText}</span>
              ) : (
                <span className="text-slate-400 italic">Start speaking… your words appear here</span>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
