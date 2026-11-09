"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

import ModelOne, { modelOneSpeak } from "../components/models/ModelOne";
import ModelTwo, { modelTwoSpeak } from "../components/models/ModelTwo";
import ModelThree, { modelThreeSpeak } from "../components/models/Modelthree";
import Chat from "../components/Chat";
import { MessageSquareText, Mic, MicOff } from "lucide-react";
import BubbleMenu from "../Animations/BubbleMenu";
import TrueFocus from "../Animations/TrueFocus";
import { useRouter } from "next/navigation";

// levenshtein + similarity stay same...
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
  const [isRecordingGroq, setIsRecordingGroq] = useState(false);

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

  // Groq Whisper MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const router = useRouter();

  // Talk With AI
  const getGeminiResponse = async (command: string) => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/askToAssistant`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/askToAssistant`,
        { command: message },
        { withCredentials: true }
      );

      const data = res.data;
      handleQuery(data);
      return res.data.response || "No response";
    } catch (err) {
      console.error(err);
      return "Error talking to AI.";
    }
  };

  const logout = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
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
  const safeRecognition = (delay = 800) => {
    if (restartTimeout.current) clearTimeout(restartTimeout.current);
    restartTimeout.current = setTimeout(() => {
      if (
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        !isRecognizingRef.current &&
        !isRecordingGroq &&
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
  };

  // Trigger command processing after silence or transcription
  const executeCommand = async (commandToSend: string) => {
    if (!commandToSend.trim() || isProcessingRef.current || isSpeakingRef.current) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);

    isAwakeRef.current = false;
    isProcessingRef.current = true;
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
      setUserText("");
      safeRecognition(500);
    }
  };

  // ----------------- Groq Whisper Universal Audio Recorder -----------------
  const getSupportedMimeType = () => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/aac",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const startGroqRecording = async () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;

    try {
      // Pause browser speech recognition if running
      if (recognitionRef.current && isRecognizingRef.current) {
        try {
          recognitionRef.current.stop();
          isRecognizingRef.current = false;
          setListening(false);
        } catch {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecordingGroq(false);
        if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

        // Stop all audio tracks to release microphone
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((track) => track.stop());
          activeStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        if (audioBlob.size < 1000) {
          setUserText("");
          safeRecognition(500);
          return;
        }

        setUserText("⚡ Transcribing with Groq Whisper...");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/user/transcribe`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true,
            }
          );

          const transcribed = (response.data?.text || "").trim();
          if (transcribed) {
            console.log("[Groq Whisper Transcription]:", transcribed);
            executeCommand(transcribed);
          } else {
            setUserText("Could not understand audio. Try again!");
            setTimeout(() => setUserText(""), 2000);
            safeRecognition(500);
          }
        } catch (err: any) {
          console.error("Groq Transcription failed:", err);
          setUserText("Transcription error. Please try again.");
          setTimeout(() => setUserText(""), 2500);
          safeRecognition(500);
        }
      };

      mediaRecorder.start(250);
      setIsRecordingGroq(true);
      setUserText("🔴 Listening via Groq Whisper... (click to stop)");

      // Auto-stop after 10 seconds max if user doesn't tap
      recordingTimeoutRef.current = setTimeout(() => {
        stopGroqRecording();
      }, 10000);
    } catch (err: any) {
      console.error("Microphone access denied or error:", err);
      setUserText("Microphone permission required!");
      setTimeout(() => setUserText(""), 3000);
    }
  };

  const stopGroqRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const toggleVoiceMode = () => {
    if (isRecordingGroq) {
      stopGroqRecording();
    } else {
      startGroqRecording();
    }
  };

  // Keyboard shortcut: Spacebar to toggle voice when not in text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target instanceof HTMLElement) {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName !== "input" && tagName !== "textarea" && !chatOpen) {
          e.preventDefault();
          toggleVoiceMode();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecordingGroq, chatOpen]);

  // ---------- Fetch User ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/current`,
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
      console.log("[Recognition] Started in language:", recognition.lang);
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("[Recognition] Ended");
      isRecognizingRef.current = false;
      setListening(false);

      if (!isSpeakingRef.current && !isProcessingRef.current) {
        safeRecognition(600);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("[Recognition] Error:", e.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (e.error !== "aborted" && !isSpeakingRef.current && !isProcessingRef.current) {
        errorCountRef.current++;
        const backoff = Math.min(4000, 800 * errorCountRef.current);
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

          // Extract text spoken after the assistant's name
          let commandAfterName = rawTranscript;
          if (hotwordRegex) {
            commandAfterName = rawTranscript.replace(hotwordRegex, "").trim();
          }

          if (commandAfterName.length > 0) {
            // User spoke both the name AND command together (e.g. "Echo what is the weather")
            accumulatedCommandRef.current = commandAfterName;
            setUserText(commandAfterName);

            // Wait 1.3s for user to finish speaking, then execute
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              executeCommand(accumulatedCommandRef.current);
            }, 1300);
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

          // Wait 1.3s of silence before sending the complete sentence
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            executeCommand(accumulatedCommandRef.current);
          }, 1300);
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
  }, [user]);

  // ---------- Handle Commands ----------
  const handleQuery = (data: any) => {
    const { type = "general", userInput = "", response = "" } = data || {};
    lastSpokenRef.current = response.toLowerCase();

    const onSpeechFinish = () => {
      setAiText("");
      setUserText("");
      isProcessingRef.current = false;
      safeRecognition(400);
    };

    if (!chatOpen && response) {
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
          onSpeechFinish();
          break;
      }
    } else {
      onSpeechFinish();
    }

    // Example: open URLs
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

      // Addingg thhhis later on
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

      // need to limit reddit to not search for adult content when comand is passed
      case "reddit-search":
        window.open(
          `https://www.reddit.com/search/?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
        break;
      case "spotify-search":
      case "spotify-open":
        window.open(
          `https://open.spotify.com/search/${encodeURIComponent(userInput)}`,
          "_blank"
        );
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
      case "gmail-open":
        window.open(`https://mail.google.com/`, "_blank");
        break;
      //
      //
      //
      //

      case "open-blackboard":
        router.push("/BlackBoard");
        break;
      case "youtube-search":
      case "youtube-play":
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            userInput
          )}`,
          "_blank"
        );
        break;
    }
  };

  // ---------- Render Model ----------
  const renderModel = () => {
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
        return <p className="text-gray-500 mt-4">No assistant model set</p>;
    }
  };

  if (!user) return <p className="text-center text-white">Loading...</p>;

  const items = [
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
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <TrueFocus
          sentence="Echo Verse"
          manualMode={false}
          blurAmount={5}
          borderColor="purple"
          animationDuration={2}
          pauseBetweenAnimations={1}
        />

        <div className="flex mr-18">
          <MessageSquareText
            className="size-7 cursor-pointer"
            onClick={() => setChatOpen(true)}
          />
        </div>
      </header>

      <Chat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSend={sendMessageToAI}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Welcome, <span className="text-indigo-400">{user.name}</span>
        </h2>

        <p className="text-gray-400 text-base mb-3">
          Say{" "}
          <span className="text-indigo-400 font-semibold">
            {user.assistantName}
          </span>{" "}
          or tap the mic / press <kbd className="px-2 py-0.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300">Space</kbd> to talk.
        </p>

        {renderModel()}

        {/* Live Speech Subtitle & Status */}
        {userText && (
          <div className="mt-3 px-5 py-2 rounded-full bg-indigo-950/90 border border-indigo-500/60 text-indigo-200 text-sm animate-pulse max-w-lg shadow-lg shadow-indigo-950/50 backdrop-blur-md">
            🎤 {userText}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            onClick={toggleVoiceMode}
            title={isRecordingGroq ? "Click to finish speaking" : "Click to speak with Groq Whisper"}
            className={`group relative flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
              isRecordingGroq
                ? "ring-4 ring-red-500/80 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                : "hover:scale-105 active:scale-95"
            } focus:outline-none`}
          >
            {!aiText && (
              <img
                src="/userVoice.gif"
                alt="Voice listening wave"
                className="w-[180px] drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
              />
            )}
            {aiText && (
              <img
                src="/aiVoice.gif"
                alt="AI speaking wave"
                className="w-[180px] drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              />
            )}
            <div
              className={`absolute bottom-1 right-1 p-2.5 rounded-full text-white shadow-md transition ${
                isRecordingGroq
                  ? "bg-red-600 animate-bounce shadow-red-500/50"
                  : listening
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isRecordingGroq ? (
                <Mic className="size-4 animate-pulse text-white" />
              ) : listening ? (
                <Mic className="size-4 animate-pulse text-white" />
              ) : (
                <MicOff className="size-4 text-gray-300" />
              )}
            </div>
          </button>
          {isRecordingGroq && (
            <span className="text-xs text-red-400 font-medium animate-pulse">
              🔴 Recording with Groq Whisper (tap again or space to send)
            </span>
          )}
        </div>
      </main>

      {/* <footer className="text-center py-4 border-t border-gray-800 text-sm text-gray-500">
        Built with ❤️ for you
      </footer> */}

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
