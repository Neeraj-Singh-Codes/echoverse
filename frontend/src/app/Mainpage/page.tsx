"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

import ModelOne, { modelOneSpeak } from "../components/models/ModelOne";
import ModelTwo, { modelTwoSpeak } from "../components/models/ModelTwo";
import ModelThree, { modelThreeSpeak } from "../components/models/Modelthree";
import Chat from "../components/Chat";
import { MessageSquareText } from "lucide-react";
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

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const lastSpokenRef = useRef<string>("");
  const restartTimeout = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);

  const router = useRouter();

  // Talk With AI
  const getGeminiResponse = async (command: string) => {
    try {
      const result = await axios.post(
        "http://localhost:8000/api/user/askToAssistant",
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
        "http://localhost:8000/api/user/askToAssistant",
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
      const res = await axios.get("http://localhost:8000/api/auth/logout", {
        withCredentials: true,
      });
      return res.data.response || "No response";
    } catch (error) {
      console.error(error);
      return "Error Logging Out";
    }
  };

  // ---------- Safe Recognition ----------
  const safeRecognition = (delay = 1000) => {
    if (restartTimeout.current) clearTimeout(restartTimeout.current);
    restartTimeout.current = setTimeout(() => {
      if (
        !isSpeakingRef.current &&
        !isRecognizingRef.current &&
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.start();
          console.log("[Recognition] Restart");
        } catch (error: any) {
          if (error.name !== "InvalidStateError") {
            console.error("[Recognition] start failed:", error);
          }
        }
      }
    }, delay);
  };

  // ---------- Fetch User ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/user/current", {
          withCredentials: true,
        });
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

    const recognition: any = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    (window as any).speechRecognitionInstance = recognition;

    recognition.onstart = () => {
      console.log("[Recognition] Started");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("[Recognition] Ended");
      isRecognizingRef.current = false;
      setListening(false);

      if (!isSpeakingRef.current) {
        safeRecognition(800);
      } else {
        console.log("[Recognition] Skipped restart (still speaking)");
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("[Recognition] Error:", e.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (e.error !== "aborted" && !isSpeakingRef.current) {
        errorCountRef.current++;
        const backoff = Math.min(5000, 1000 * errorCountRef.current);
        safeRecognition(backoff);
      }
    };

    recognition.onresult = async (e: any) => {
      if (isSpeakingRef.current) {
        console.log("[Recognition] Ignored because speaking");
        return;
      }

      const transcript = e.results[e.results.length - 1][0].transcript
        .trim()
        .toLowerCase();
      console.log("[Recognition] Heard:", transcript);

      if (
        lastSpokenRef.current &&
        similarity(transcript, lastSpokenRef.current) > 0.7
      ) {
        console.log("[Recognition] Ignored echo");
        return;
      }

      const hotword = new RegExp(`\\b${user.assistantName.toLowerCase()}\\b`);
      if (hotword.test(transcript)) {
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript);
        console.log("[Assistant Response]:", data);
        handleQuery(data);
        setAiText(data.response);
        setUserText("");
      }
    };

    const fallBackCheck = setInterval(() => {
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        safeRecognition(500);
      }
    }, 10000);

    safeRecognition();

    return () => {
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
      clearInterval(fallBackCheck);
    };
  }, [user]);

  // ---------- Handle Commands ----------
  const handleQuery = (data: any) => {
    const { type = "general", userInput = "", response = "" } = data || {};
    lastSpokenRef.current = response.toLowerCase();

    // Model-specific speak
    switch (user.assistantImage) {
      case "/model1.jpg":
        modelOneSpeak(response, isSpeakingRef, () => safeRecognition());
        break;
      case "/model2.png":
        modelTwoSpeak(response, isSpeakingRef, () => safeRecognition());
        break;
      case "/model3.jpg":
        modelThreeSpeak(response, isSpeakingRef, () => safeRecognition());
        break;
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

        <p className="text-gray-400 text-base mb-6">
          Say{" "}
          <span className="text-indigo-400 font-semibold">
            {user.assistantName}
          </span>{" "}
          to wake me up.
        </p>

        {renderModel()}

        <div className="flex items-center gap-4">
          <span className={"flex items-center justify-centerrounded-full "}>
            {!aiText && <img src="userVoice.gif" className="w-[200px]" />}
            {aiText && <img src="aiVoice.gif" className="w-[200px]" />}
          </span>
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
