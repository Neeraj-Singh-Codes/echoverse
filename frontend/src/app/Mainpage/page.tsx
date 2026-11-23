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

const Mainpage = () => {
  const [user, setUser] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");

  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isAwakeRef = useRef(false);
  const awakeExpireTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Groq Whisper Hands-Free VAD refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVadActiveRef = useRef(false);

  const router = useRouter();

  // Helper for MIME type support across all browsers (Chrome, Brave, Firefox, Safari)
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

  // Transcribe audio using backend Groq Whisper Large V3
  const transcribeWithGroq = async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/transcribe`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      return (res.data?.text || "").trim();
    } catch (err: any) {
      console.warn("[Groq Whisper STT] Error:", err.response?.data || err.message || err);
      return "";
    }
  };

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

  // Trigger command processing
  const executeCommand = async (commandToSend: string) => {
    if (!commandToSend.trim() || isProcessingRef.current || isSpeakingRef.current) return;

    if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);

    isAwakeRef.current = false;
    isProcessingRef.current = true;

    setAiText("");
    setUserText(commandToSend);

    console.log("[Groq Voice Execution] Sending command:", commandToSend);
    const data = await getGeminiResponse(commandToSend);
    console.log("[Assistant Response]:", data);

    if (data && data.response) {
      handleQuery(data);
      setAiText(data.response);
    } else {
      isProcessingRef.current = false;
      setUserText("");
    }
  };

  // Handle transcribed speech from Groq Whisper
  const handleHandsFreeTranscript = (transcript: string) => {
    if (!transcript || isSpeakingRef.current || isProcessingRef.current) return;

    const assistantName = (user?.assistantName || "").trim().toLowerCase();
    const escapedHotword = assistantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hotwordRegex = escapedHotword ? new RegExp(`\\b${escapedHotword}\\b`, "i") : null;

    if (hotwordRegex && hotwordRegex.test(transcript)) {
      // Wake word detected!
      const command = transcript.replace(hotwordRegex, "").trim();
      if (!command) {
        // User said only the assistant's name (e.g. "Echo")
        setUserText("Listening...");
        isAwakeRef.current = true;
        if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
        awakeExpireTimeoutRef.current = setTimeout(() => {
          isAwakeRef.current = false;
          setUserText("");
        }, 7000);
      } else {
        // User spoke the name and the command together (e.g. "Echo what is the weather today")
        setUserText(command);
        executeCommand(command);
      }
    } else if (isAwakeRef.current) {
      // Already awake from previous turn
      isAwakeRef.current = false;
      setUserText(transcript);
      executeCommand(transcript);
    }
  };

  // Continuous Hands-Free Groq Whisper Listener (100% universal across Chrome, Brave, Firefox, Safari)
  const startHandsFreeVadListener = async () => {
    if (isVadActiveRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      isVadActiveRef.current = true;
      setListening(true);
      console.log("[Hands-Free] Universal Groq Whisper voice listening active");

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Resume audio context on first interaction if browser started it in suspended state
      if (audioCtx.state === "suspended") {
        const resumeAudio = () => {
          audioCtx.resume();
          window.removeEventListener("click", resumeAudio);
        };
        window.addEventListener("click", resumeAudio, { once: true });
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const mimeType = getSupportedMimeType();
      let mediaRecorder: MediaRecorder | null = null;
      let chunks: Blob[] = [];
      let isRecordingVoice = false;
      let silenceTimer: NodeJS.Timeout | null = null;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!isVadActiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Only listen when assistant is NOT speaking and NOT processing
        if (!isSpeakingRef.current && !isProcessingRef.current) {
          if (avg > 14) {
            // Voice detected
            if (!isRecordingVoice) {
              isRecordingVoice = true;
              chunks = [];
              mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
              mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
              };
              mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
                if (audioBlob.size > 2000 && !isSpeakingRef.current && !isProcessingRef.current) {
                  setUserText("Listening...");
                  const transcript = await transcribeWithGroq(audioBlob);
                  if (transcript) {
                    handleHandsFreeTranscript(transcript);
                  } else {
                    setUserText("");
                  }
                }
              };
              mediaRecorder.start(100);
            }

            // Reset silence timeout on speech
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              if (isRecordingVoice && mediaRecorder && mediaRecorder.state !== "inactive") {
                isRecordingVoice = false;
                mediaRecorder.stop();
              }
            }, 1100);
          }
        } else {
          if (isRecordingVoice && mediaRecorder && mediaRecorder.state !== "inactive") {
            isRecordingVoice = false;
            mediaRecorder.stop();
          }
        }
      };

      const intervalId = setInterval(checkVolume, 75);
      vadIntervalRef.current = intervalId;
    } catch (err) {
      console.warn("[Hands-Free] Microphone access or AudioContext notice:", err);
    }
  };

  // Manual wake-up if user taps the orb
  const wakeUpAssistant = () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;
    if (!isVadActiveRef.current) {
      startHandsFreeVadListener();
    }
    isAwakeRef.current = true;
    setUserText("Listening...");
    if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
    awakeExpireTimeoutRef.current = setTimeout(() => {
      if (isAwakeRef.current) {
        isAwakeRef.current = false;
        setUserText("");
      }
    }, 7000);
  };

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

  // ---------- Initialize Universal Hands-Free Groq Whisper ----------
  useEffect(() => {
    if (!user) return;

    startHandsFreeVadListener();

    return () => {
      isVadActiveRef.current = false;
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
      setListening(false);
      if (awakeExpireTimeoutRef.current) clearTimeout(awakeExpireTimeoutRef.current);
    };
  }, [user]);

  // ---------- Handle Commands ----------
  const handleQuery = (data: any) => {
    const { type = "general", userInput = "", response = "" } = data || {};

    const onSpeechFinish = () => {
      setAiText("");
      setUserText("");
      isProcessingRef.current = false;
    };

    if (!chatOpen && response) {
      switch (user.assistantImage) {
        case "/model1.jpg":
          modelOneSpeak(response, isSpeakingRef, undefined, onSpeechFinish);
          break;
        case "/model2.png":
          modelTwoSpeak(response, isSpeakingRef, undefined, onSpeechFinish);
          break;
        case "/model3.jpg":
          modelThreeSpeak(response, isSpeakingRef, undefined, onSpeechFinish);
          break;
        default:
          onSpeechFinish();
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
            startRecognition={() => {}}
          />
        );
      case "/model2.png":
        return (
          <ModelTwo
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => {}}
          />
        );
      case "/model3.jpg":
        return (
          <ModelThree
            isSpeakingRef={isSpeakingRef}
            startRecognition={() => {}}
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

        <p className="text-gray-400 text-base mb-4">
          Say{" "}
          <span className="text-indigo-400 font-semibold">
            {user.assistantName}
          </span>{" "}
          to wake me up.
        </p>

        {renderModel()}

        {/* Live Speech Subtitle & Status */}
        {userText && (
          <div className="mt-3 px-5 py-2 rounded-full bg-indigo-950/90 border border-indigo-500/60 text-indigo-200 text-sm animate-pulse max-w-lg shadow-lg shadow-indigo-950/50 backdrop-blur-md">
            🎤 {userText}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 mt-4">
          <div
            onClick={wakeUpAssistant}
            title="Click to activate voice listening"
            className="group relative flex items-center justify-center p-2 rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
          >
            {!aiText && (
              <img
                src="/userVoice.gif"
                alt="Voice listening wave"
                className="w-[180px] drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              />
            )}
            {aiText && (
              <img
                src="/aiVoice.gif"
                alt="AI speaking wave"
                className="w-[180px] drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              />
            )}
            <div className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white shadow-md transition">
              {listening ? <Mic className="size-4 animate-pulse" /> : <MicOff className="size-4 text-gray-300" />}
            </div>
          </div>
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
