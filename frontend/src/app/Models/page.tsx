"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Volume2 } from "lucide-react";
import { getApiUrl } from "../utils/apiUrl";

const avatars = [
  {
    image: "/model1.jpg",
    title: "EchoVerse Model 1",
    archetype: "US Natural",
    accent: "en-US",
    sampleText: "Hello! I am EchoVerse Model 1, your intelligent assistant.",
    description:
      "A balanced AI with a calm and natural American voice. Designed for smooth and intelligent interactions, this model blends futuristic visuals with human-like tone and clarity.",
    number: "01",
  },
  {
    image: "/model2.png",
    title: "EchoVerse Model 2",
    archetype: "Hindi & English Bilingual",
    accent: "en-IN",
    sampleText: "नमस्ते! I am EchoVerse Model 2. I communicate with expressive cultural depth and localized intelligence.",
    description:
      "A bilingual powerhouse that communicates in Hindi with expressive intonation. With sci-fi energy and cultural depth, it brings emotional connection and localized intelligence to EchoVerse.",
    number: "02",
  },
  {
    image: "/model3.jpg",
    title: "EchoVerse Model 3",
    archetype: "British Sophisticated",
    accent: "en-GB",
    sampleText: "Greetings. I am EchoVerse Model 3. Sophisticated, articulate, and poised at your service.",
    description:
      "An elegant and articulate AI with a refined British accent. Featuring a higher pitch and poised tone, it delivers answers with sophistication and immersive presence.",
    number: "03",
  },
];

const Models = () => {
  const [index, setIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const router = useRouter();

  // cycle forward & loop
  const nextModel = () => {
    stopPreview();
    setIndex((prev) => (prev + 1) % avatars.length);
  };

  const prevModel = () => {
    stopPreview();
    setIndex((prev) => (prev - 1 + avatars.length) % avatars.length);
  };

  const stopPreview = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const playVoicePreview = (m: typeof avatars[0]) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(m.sampleText);
    utterance.lang = m.accent;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(m.accent));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Save model → ChooseName
  const handleSelect = async () => {
    stopPreview();
    try {
      await axios.put(
        `${getApiUrl()}/api/user/assistant`,
        { assistantImage: avatars[index].image },
        { withCredentials: true }
      );
      router.push("/ChooseName");
    } catch (err: any) {
      console.error("Error saving avatar:", err.response?.data || err);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a14] text-white relative">
      {/* Track */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse top-10 left-10"
        />
        <div
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-3xl opacity-15 animate-bounce"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <motion.div
        className="flex h-screen w-full"
        animate={{ x: `-${index * 100}vw` }}
        transition={{ duration: 0.8, ease: [0.2, 0.9, 0.3, 1] }}
      >
        {avatars.map((m, i) => (
          <section
            key={m.number}
            className="flex-shrink-0 w-screen h-screen flex justify-center items-center relative"
          >
            {/* Big number */}
            <div className="z-15 absolute left-[4vw] top-1/2 -translate-y-1/2 text-[22rem] md:text-[28rem] font-black text-gray-400/15 leading-none pointer-events-none select-none tracking-[-8px] drop-shadow-lg ">
              {m.number}
            </div>

            {/* Image block */}
            <motion.div
              className="relative w-[70vw] h-[75vh] md:h-[85vh] ml-[20vw] rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between bg-gradient-to-b from-white/5 to-black/30 p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: i === index ? 1 : 0.2,
                y: i === index ? 0 : 20,
              }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative flex-1 w-full rounded-lg overflow-hidden">
                <Image
                  src={m.image}
                  alt={m.title}
                  fill
                  className="object-cover transition-transform duration-[1500ms] ease-in-out hover:scale-105"
                  priority={i === 0}
                />
              </div>

              <div className="z-10 flex flex-col md:flex-row items-center justify-between mt-6 gap-6">
                <div className="flex flex-wrap items-center gap-4 max-w-[650px]">
                  <button
                    onClick={handleSelect}
                    className="fancy-btn px-8 py-4 border-2 border-purple-500 font-bold text-white bg-transparent text-xl 
      hover:bg-purple-600/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer"
                  >
                    Select {m.title}
                  </button>

                  {/* Voice Preview Button */}
                  <button
                    onClick={() => playVoicePreview(m)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-semibold transition-all shadow-md cursor-pointer ${
                      isPlayingAudio
                        ? "bg-purple-600/40 border-purple-400 text-purple-200 animate-pulse"
                        : "bg-gray-800/80 border-gray-700 hover:border-purple-500 text-gray-200 hover:text-white"
                    }`}
                    title="Preview voice"
                  >
                    <Volume2 className="size-4" />
                    <span>{isPlayingAudio ? "Playing Voice..." : "Preview Voice"}</span>
                  </button>

                  <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    {m.archetype}
                  </span>
                </div>

                {/* Right side: Next and Prev model buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevModel}
                    aria-label="Previous model"
                    className="z-12 p-4 rounded-full bg-gray-700 hover:bg-purple-500 transition-all 
      shadow-lg hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer"
                  >
                    <ChevronLeft className="w-7 h-7 text-white" />
                  </button>

                  <button
                    onClick={nextModel}
                    aria-label="Next model"
                    className="z-12 p-4 rounded-full bg-gray-700 hover:bg-purple-500 transition-all 
      shadow-lg hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer"
                  >
                    <ChevronRight className="w-7 h-7 text-white" />
                  </button>
                </div>
              </div>

              <p className="mt-4 leading-snug text-base md:text-lg max-w-2xl 
    bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent 
    drop-shadow-[0_0_10px_rgba(147,51,234,0.3)]">{m.description}</p>
            </motion.div>
          </section>
        ))}
      </motion.div>

      {/* Bottom Center Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {avatars.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => {
              stopPreview();
              setIndex(dotIdx);
            }}
            aria-label={`Jump to model ${dotIdx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              dotIdx === index
                ? "w-8 h-2.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                : "w-2.5 h-2.5 bg-gray-600 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Models;