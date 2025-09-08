"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

const avatarToSpline: Record<string, string> = {
  "/model1.jpg": "https://prod.spline.design/aMiMaHmriiulsLTF/scene.splinecode",
  "/echoverse-avatar.jpg":
    "https://prod.spline.design/3R30UV0N-hg8sKge/scene.splinecode",
  "/model3.jpg": "https://prod.spline.design/INQWwQTCOLrGcrOD/scene.splinecode",
};

const Mainpage = () => {
  const [user, setUser] = useState<any>(null);

  const getGeminiResponse = async (command: any) => {
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

  useEffect(() => {
    // Fetching User here
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/user/current", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err: any) {
        console.error(
          "Error fetching user:",
          err.response?.data || err.message
        );
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return; // wait until user is fetched

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log(transcript);

      if (transcript.toLowerCase().includes(user.assistantName.toLowerCase())) {
        const data = await getGeminiResponse(transcript);
        console.log(data);
      }
    };

    recognition.start();

    return () => recognition.stop(); // cleanup on unmount
  }, [user]); // <--- dependency ensures effect runs after user is loaded

  if (!user) return <p>Loading...</p>;

  const splineUrl = avatarToSpline[user.assistantImage];

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
      <h1 className="text-4xl font-bold text-white mt-15">
        Welcome, {user.assistantName || "Assistant"}!
      </h1>

      {splineUrl ? (
        <div className="w-full h-fit mt-6 ">
          <Spline scene={splineUrl} />
        </div>
      ) : user.assistantImage ? (
        <img
          src={user.assistantImage}
          alt="Assistant"
          className="w-40 h-40 mt-4 rounded-full shadow-lg"
        />
      ) : (
        <p className="mt-4 text-gray-400">No assistant model set</p>
      )}
    </div>
  );
};

export default Mainpage;
