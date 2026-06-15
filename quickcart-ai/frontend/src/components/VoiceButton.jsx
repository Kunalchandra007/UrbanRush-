import { useState, useRef, useEffect } from "react";

export default function VoiceButton({ onResult, onInterim }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const latestRef = useRef(""); // freshest transcript (avoids stale closures)
  const firedRef = useRef(false); // ensure we only submit once per session

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  const stop = () => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        /* noop */
      }
    }
  };

  const startListening = () => {
    if (listening) {
      stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = true; // live transcription
    rec.continuous = false; // auto-stops after a natural pause, then submits
    rec.maxAlternatives = 1;

    latestRef.current = "";
    firedRef.current = false;
    setLiveText("");
    setError("");

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      full = full.trim();
      latestRef.current = full;
      setLiveText(full);
      if (onInterim) onInterim(full); // stream into the input box live
    };

    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone blocked. Allow mic access in your browser and try again.");
      } else if (e.error === "no-speech") {
        setError("Didn't catch that. Tap the mic and speak clearly.");
      } else if (e.error === "audio-capture") {
        setError("No microphone found. Check your device.");
      } else if (e.error === "network") {
        setError("Voice needs Google's speech service. Use Chrome or Edge — Brave/Firefox block it by default.");
      } else if (e.error !== "aborted") {
        setError(`Voice error (${e.error || "unknown"}). Try Chrome or Edge.`);
      }
    };

    rec.onend = () => {
      setListening(false);
      const result = latestRef.current.trim();
      if (result && !firedRef.current) {
        firedRef.current = true;
        onResult(result);
      }
      setLiveText("");
    };

    try {
      rec.start();
    } catch {
      // start() throws if called while already running — reset state
      setListening(false);
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
                <span className="text-xs font-semibold text-red-300">Listening… speak now</span>
              </div>
              <button
                onClick={stop}
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
