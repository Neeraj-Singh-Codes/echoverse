"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";

import ModelOne, { modelOneSpeak } from "../components/models/ModelOne";
import ModelTwo, { modelTwoSpeak } from "../components/models/ModelTwo";
import ModelThree, { modelThreeSpeak } from "../components/models/Modelthree";
import Chat from "../components/Chat";
import { MessageSquareText, Mic, MicOff, Sparkles } from "lucide-react";
import BubbleMenu from "../Animations/BubbleMenu";
import TrueFocus from "../Animations/TrueFocus";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../utils/apiUrl";

// levenshtein distance calculation
const levenshtein = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};
const similarity = (a: string, b: string) =>
  1 - levenshtein(a, b) / Math.max(a.length, b.length);

const Mainpage = () => {
  const [user, setUser] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [assistantState, setAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const lastSpokenRef = useRef<string>("");
  const restartTimeout = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);

  // Enhanced voice state refs
  const isAwakeRef = useRef(false);
  const isProcessingRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awakeExpireTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedCommandRef = useRef<string>("");

  const router = useRouter();

  // Talk With AI
  const getGeminiResponse = async (command: string) => {
    try {
      const result = await axios.post(
        `${getApiUrl()}/api/user/askToAssistant`,
        { command },
        { withCredentials: true }
      );
      return result.data;
    } catch (error) {
      console.log("Mainpage Error", error);
    }
  };

  // Chat with AI
  const sendMessageToAI = async (message: string): Promise<string> => {
    try {
      const res = await axios.post(
        `${getApiUrl()}/api/user/askToAssistant`,
        { command: message },
        { withCredentials: true }
      );

      const data = res.data;
      handleQuery(data);
      return res.data.response || "No response";
    } catch (err: any) {
      console.error("[sendMessageToAI Error]:", err.response?.data || err.message || err);
      return (
        err.response?.data?.response ||
        "I'm having trouble thinking right now. Please try again in a moment."
      );
    }
  };

  const logout = async () => {
    try {
      const res = await axios.get(
        `${getApiUrl()}/api/auth/logout`,
        {
          withCredentials: true,
        }
      );
      return res.data.response || "No response";
    } catch (error) {
      console.error(error);
      return "Error Logging Out";
    }
  };

  // ---------- Safe Recognition ----------
  const safeRecognition = useCallback((delay = 600) => {
    if (restartTimeout.current) clearTimeout(restartTimeout.current);
    restartTimeout.current = setTimeout(() => {
      if (
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        !isRecognizingRef.current &&
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.start();
          console.log("[Recognition] Restarted successfully");
        } catch (error: any) {
          if (error.name !== "InvalidStateError") {
            console.warn("[Recognition] Start warning:", error.message || error);
          }
        }
      }
    }, delay);
  }, []);

  // Trigger command processing after silence
  const executeCommand = async (commandToSend: string) => {
    if (!commandToSend.trim() || isProcessingRef.current || isSpeakingRef.current) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);

    isAwakeRef.current = false;
    isProcessingRef.current = true;
    setAssistantState("thinking");
    accumulatedCommandRef.current = "";

    try {
      if (recognitionRef.current && isRecognizingRef.current) {
        recognitionRef.current.stop();
        isRecognizingRef.current = false;
        setListening(false);
      }
    } catch {}

    setAiText("");
    setUserText(commandToSend);

    console.log("[Voice Execution] Sending command:", commandToSend);
    const data = await getGeminiResponse(commandToSend);
    console.log("[Assistant Response]:", data);

    if (data && data.response) {
      handleQuery(data);
      setAiText(data.response);
    } else {
      isProcessingRef.current = false;
      setAssistantState("idle");
      setUserText("");
      safeRecognition(500);
    }
  };

  // Manual activate / tap to talk
  const activateVoiceListening = () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;
    isAwakeRef.current = true;
    setAssistantState("listening");
    setUserText("Listening...");
    accumulatedCommandRef.current = "";
    if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
    awakeExpireTimeoutRef.current = setTimeout(() => {
      if (isAwakeRef.current && !accumulatedCommandRef.current) {
        isAwakeRef.current = false;
        setAssistantState("idle");
        setUserText("");
      }
    }, 7000);

    if (!isRecognizingRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  // ---------- Fetch User ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${getApiUrl()}/api/user/current`,
          {
            withCredentials: true,
          }
        );
        setUser(res.data);
      } catch (err: any) {
        console.log(err.response?.data || err.message);
      }
    };
    fetchUser();
  }, []);

  // ---------- Speech Recognition ----------
  useEffect(() => {
    if (!user) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition: any = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Stream words in real-time

    // Match language to selected model
    if (user.assistantImage === "/model2.png") {
      recognition.lang = "hi-IN";
    } else if (user.assistantImage === "/model3.jpg") {
      recognition.lang = "en-GB";
    } else {
      recognition.lang = "en-US";
    }

    recognitionRef.current = recognition;
    (window as any).speechRecognitionInstance = recognition;

    recognition.onstart = () => {
      console.log("[Recognition] Live & Listening in language:", recognition.lang);
      isRecognizingRef.current = true;
      setListening(true);
      errorCountRef.current = 0;
    };

    recognition.onend = () => {
      console.log("[Recognition] Ended");
      isRecognizingRef.current = false;
      setListening(false);

      if (!isSpeakingRef.current && !isProcessingRef.current) {
        safeRecognition(400);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") {
        return;
      }
      console.warn("[Recognition] Error notice:", e.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (e.error !== "aborted" && !isSpeakingRef.current && !isProcessingRef.current) {
        errorCountRef.current++;
        const backoff = Math.min(3000, 800 * errorCountRef.current);
        safeRecognition(backoff);
      }
    };

    recognition.onresult = async (e: any) => {
      if (isSpeakingRef.current || isProcessingRef.current) {
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const item = e.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript + " ";
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const rawTranscript = (finalTranscript || interimTranscript).trim();
      if (!rawTranscript) return;

      const lowerTranscript = rawTranscript.toLowerCase();
      console.log("[Recognition] Heard:", rawTranscript);

      // Safe hotword regex escape
      const assistantName = (user.assistantName || "").trim().toLowerCase();
      const escapedHotword = assistantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const hotwordRegex = escapedHotword ? new RegExp(`\\b${escapedHotword}\\b`, "i") : null;

      // Check if user says the hotword
      const containsHotword = hotwordRegex ? hotwordRegex.test(lowerTranscript) : false;

      if (!isAwakeRef.current) {
        // Not awake yet: check for wake word
        if (containsHotword) {
          console.log("[Wake Word Detected]:", assistantName);
          isAwakeRef.current = true;
          setAssistantState("listening");

          // Extract text spoken after the assistant's name
          let commandAfterName = rawTranscript;
          if (hotwordRegex) {
            commandAfterName = rawTranscript.replace(hotwordRegex, "").trim();
          }

          if (commandAfterName.length > 0) {
            // User spoke both the name AND command together (e.g. "Echo what is the weather")
            accumulatedCommandRef.current = commandAfterName;
            setUserText(commandAfterName);

            // Wait 1.2s for user to finish speaking, then execute
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              executeCommand(accumulatedCommandRef.current);
            }, 1200);
          } else {
            // User just said the name (e.g. "Echo")
            setUserText("Listening...");
            accumulatedCommandRef.current = "";

            // Keep listening for command for up to 7 seconds
            if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
            awakeExpireTimeoutRef.current = setTimeout(() => {
              if (isAwakeRef.current && !accumulatedCommandRef.current) {
                console.log("[Wake timeout] No command heard, sleeping");
                isAwakeRef.current = false;
                setAssistantState("idle");
                setUserText("");
              }
            }, 7000);
          }
        }
      } else {
        // Already awake: capture full speech as the command
        let cleanCommand = rawTranscript;
        if (hotwordRegex) {
          cleanCommand = rawTranscript.replace(hotwordRegex, "").trim() || rawTranscript;
        }

        if (cleanCommand.length > 0) {
          accumulatedCommandRef.current = cleanCommand;
          setUserText(cleanCommand);

          // Reset awake expiration since user is actively speaking
          if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);

          // Wait 1.2s of silence before sending the complete sentence
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            executeCommand(accumulatedCommandRef.current);
          }, 1200);
        }
      }
    };

    const fallBackCheck = setInterval(() => {
      if (!isSpeakingRef.current && !isProcessingRef.current && !isRecognizingRef.current) {
        safeRecognition(500);
      }
    }, 8000);

    safeRecognition(500);

    return () => {
      try {
        recognition.stop();
      } catch {}
      setListening(false);
      isRecognizingRef.current = false;
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
      clearInterval(fallBackCheck);
    };
  }, [user, safeRecognition]);

  // ---------- Handle Commands ----------
  const handleQuery = (data: any) => {
    const { type = "general", userInput = "", response = "" } = data || {};
    lastSpokenRef.current = response.toLowerCase();

    const onSpeechFinish = () => {
      setAiText("");
      setUserText("");
      isProcessingRef.current = false;
      setAssistantState("idle");
      safeRecognition(400);
    };

    if (!chatOpen && response) {
      setAssistantState("speaking");
      switch (user.assistantImage) {
        case "/model1.jpg":
          modelOneSpeak(response, isSpeakingRef, () => safeRecognition(), onSpeechFinish);
          break;
        case "/model2.png":
          modelTwoSpeak(response, isSpeakingRef, () => safeRecognition(), onSpeechFinish);
          break;
        case "/model3.jpg":
          modelThreeSpeak(response, isSpeakingRef, () => safeRecognition(), onSpeechFinish);
          break;
        default:
          modelOneSpeak(response, isSpeakingRef, () => safeRecognition(), onSpeechFinish);
          break;
      }
    } else {
      onSpeechFinish();
    }

    // Actions
    switch (type) {
      case "google-search":
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "calculator-open":
        window.open(`https://www.google.com/search?q=calculator`, "_blank");
        break;
      case "instagram-open":
        window.open(`https://www.instagram.com`, "_blank");
        break;
      case "facebook-open":
        window.open(`https://www.facebook.com`, "_blank");
        break;
      case "weather-show":
        window.open(`https://www.google.com/search?q=weather`, "_blank");
        break;
      case "wikipedia-search":
        window.open(
          `https://en.wikipedia.org/wiki/${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "x-search":
        window.open(
          `https://twitter.com/search?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "linkedin-search":
        window.open(
          `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
            userInput
          )}`,
          "_blank"
        );
        break;
      case "reddit-search":
        window.open(
          `https://www.reddit.com/search/?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "spotify-open":
        window.open(`https://open.spotify.com/search/${encodeURIComponent(userInput)}`, "_blank");
        break;
      case "maps-search":
        window.open(
          `https://www.google.com/maps/search/${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "translate-search":
        window.open(
          `https://translate.google.com/?text=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "github-search":
        window.open(
          `https://github.com/search?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "youtube-search":
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "youtube-play":
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "gmail-open":
        window.open(`https://mail.google.com/`, "_blank");
        break;
      case "open-blackboard":
        router.push("/BlackBoard");
        break;
      default:
        break;
    }
  };

  const renderedModel = useMemo(() => {
    if (!user) return null;
    switch (user.assistantImage) {
      case "/model1.jpg":
        return (
          <ModelOne
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => safeRecognition()}
          />
        );
      case "/model2.png":
        return (
          <ModelTwo
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => safeRecognition()}
          />
        );
      case "/model3.jpg":
        return (
          <ModelThree
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => safeRecognition()}
          />
        );
      default:
        return (
          <ModelOne
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => safeRecognition()}
          />
        );
    }
  }, [user?.assistantImage, safeRecognition]);

  const items = useMemo(
    () => [
      {
        label: "home",
        href: "/Homepage",
        ariaLabel: "Home",
        rotation: -8,
        hoverStyles: { bgColor: "#3b82f6", textColor: "#ffffff" },
      },
      {
        label: "Models",
        href: "/Models",
        ariaLabel: "Model",
        rotation: 8,
        hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
      },
      {
        label: "Model Name",
        href: "/ChooseName",
        ariaLabel: "Model Name",
        rotation: 8,
        hoverStyles: { bgColor: "#f59e0b", textColor: "#ffffff" },
      },
      {
        label: "BlackBoard",
        href: "/BlackBoard",
        ariaLabel: "BlackBoard",
        rotation: 8,
        hoverStyles: { bgColor: "#ef4444", textColor: "#ffffff" },
      },
      {
        label: "Log Out",
        href: "#",
        ariaLabel: "Log Out",
        rotation: -8,
        hoverStyles: { bgColor: "#8b5cf6", textColor: "#ffffff" },
        onClick: async () => {
          await logout();
          router.push("/Homepage");
        },
      },
    ],
    [router]
  );

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Initializing EchoVerse...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white relative overflow-hidden select-none">
      {/* Subtle Ambient Cosmic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-10 py-3 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md z-20 shrink-0">
        <TrueFocus
          sentence="Echo Verse"
          manualMode={false}
          blurAmount={4}
          borderColor="#818cf8"
          animationDuration={2}
          pauseBetweenAnimations={1}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setChatOpen(true)}
            title="Open AI Chat"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <MessageSquareText className="size-4 text-indigo-400" />
            <span className="text-xs font-medium hidden sm:inline">Text Chat</span>
          </button>
        </div>
      </header>

      <Chat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSend={sendMessageToAI}
      />

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col items-center justify-between py-2 md:py-4 px-4 text-center z-10 max-h-[calc(100vh-65px)] overflow-hidden">
        {/* User Welcome & Callout */}
        <div className="shrink-0 space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Welcome, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user.name}</span>
          </h2>

          <p className="text-zinc-400 text-xs md:text-sm font-medium">
            Say{" "}
            <span className="text-indigo-400 font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30">
              {user.assistantName}
            </span>{" "}
            or tap the orb to talk.
          </p>
        </div>

        {/* 3D Model Stage with Ambient Pedestal */}
        <div className="relative flex-1 flex items-center justify-center w-full max-w-xl my-auto">
          {/* Holographic Stage Halo */}
          <div className="absolute inset-x-8 bottom-4 h-16 bg-gradient-to-t from-indigo-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
          {renderedModel}
        </div>

        {/* Fixed HUD Space for Speech Transcript (prevents layout jumping) */}
        <div className="min-h-[42px] flex items-center justify-center shrink-0 w-full px-4">
          {userText && (
            <div className="px-5 py-2 rounded-full bg-zinc-950/85 border border-indigo-500/50 text-indigo-200 text-xs md:text-sm font-medium shadow-[0_0_25px_rgba(99,102,241,0.3)] backdrop-blur-xl flex items-center gap-2 max-w-lg truncate">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="truncate">{userText}</span>
            </div>
          )}
          {!userText && aiText && (
            <div className="px-5 py-2 rounded-full bg-purple-950/85 border border-purple-500/50 text-purple-200 text-xs md:text-sm font-medium shadow-[0_0_25px_rgba(168,85,247,0.3)] backdrop-blur-xl flex items-center gap-2 max-w-lg truncate">
              <Sparkles className="size-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{aiText}</span>
            </div>
          )}
        </div>

        {/* Unified Cyber-Orb Voice Dock */}
        <div className="relative flex flex-col items-center justify-center shrink-0 pb-2">
          {/* Ambient Reactive Halo */}
          <div
            className={`absolute -inset-3 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
              assistantState === "speaking"
                ? "bg-purple-600/35 scale-110"
                : assistantState === "thinking"
                ? "bg-cyan-500/30 animate-pulse scale-105"
                : assistantState === "listening"
                ? "bg-indigo-500/40 animate-ping duration-1000 scale-105"
                : "bg-indigo-600/15 scale-95"
            }`}
          />

          {/* Interactive Pedestal Orb */}
          <button
            onClick={activateVoiceListening}
            title="Click to speak directly or say wake word"
            className={`group relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full border backdrop-blur-2xl transition-all duration-300 focus:outline-none cursor-pointer ${
              assistantState === "speaking"
                ? "bg-purple-950/50 border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.4)] scale-105"
                : assistantState === "thinking"
                ? "bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse"
                : assistantState === "listening"
                ? "bg-indigo-950/60 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.5)] scale-105"
                : "bg-zinc-950/60 border-zinc-800/80 shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:border-indigo-500/50 hover:scale-102"
            }`}
          >
            {/* Blended Circular Waveform */}
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
              {assistantState === "speaking" ? (
                <img
                  src="/aiVoice.gif"
                  alt="AI Speaking"
                  className="w-full h-full object-cover mix-blend-screen scale-110"
                />
              ) : (
                <img
                  src="/userVoice.gif"
                  alt="Voice Wave"
                  className={`w-full h-full object-cover mix-blend-screen transition-opacity duration-300 ${
                    assistantState === "idle" ? "opacity-65 contrast-125" : "opacity-100"
                  }`}
                />
              )}
            </div>

            {/* Mic Status Badge */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 p-1.5 md:p-2 rounded-full border shadow-md transition-all duration-300 ${
                assistantState === "speaking"
                  ? "bg-purple-600 border-purple-400 text-white"
                  : assistantState === "listening"
                  ? "bg-indigo-600 border-indigo-400 text-white animate-bounce"
                  : listening
                  ? "bg-indigo-600/90 border-indigo-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}
            >
              {listening ? (
                <Mic className="size-3.5 md:size-4 animate-pulse" />
              ) : (
                <MicOff className="size-3.5 md:size-4" />
              )}
            </div>
          </button>

          {/* Status Label */}
          <span
            className={`mt-1.5 text-[10px] md:text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${
              assistantState === "speaking"
                ? "text-purple-400"
                : assistantState === "thinking"
                ? "text-cyan-400 animate-pulse"
                : assistantState === "listening"
                ? "text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            {assistantState === "speaking"
              ? "Responding..."
              : assistantState === "thinking"
              ? "Thinking..."
              : assistantState === "listening"
              ? "Listening to you..."
              : "Tap or say name"}
          </span>
        </div>
      </main>

      <BubbleMenu
        logo={<span style={{ fontWeight: 700 }}>RB</span>}
        items={items}
        menuAriaLabel="Toggle navigation"
        menuBg="#ffffff"
        menuContentColor="#111111"
        useFixedPosition={false}
        animationEase="back.out(1.5)"
        animationDuration={0.5}
        staggerDelay={0.12}
      />
    </div>
  );
};

export default Mainpage;
