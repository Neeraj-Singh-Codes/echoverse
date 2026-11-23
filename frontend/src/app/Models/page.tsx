"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Volume2, Sparkles, Check } from "lucide-react";
import { getApiUrl } from "../utils/apiUrl";

const avatars = [
  {
    image: "/model1.jpg",
    title: "EchoVerse Model 1",
    archetype: "US Natural",
    accent: "en-US",
    sampleText: "Hello! I am EchoVerse Model 1. I blend human-like tone, intelligent reasoning, and calm clarity.",
    description:
      "A balanced AI with a calm and natural American voice. Designed for smooth and intelligent interactions, this model blends futuristic visuals with human-like tone and clarity.",
    number: "01",
    tagColor: "from-blue-500 to-indigo-500",
  },
  {
    image: "/model2.png",
    title: "EchoVerse Model 2",
    archetype: "Hindi & English Bilingual",
    accent: "hi-IN",
    sampleText: "नमस्ते! मैं इकोवर्स मॉडल 2 हूँ। मैं आपकी सहायता करने के लिए तैयार हूँ।",
    description:
      "A bilingual powerhouse that communicates with expressive intonation. With sci-fi energy and cultural depth, it brings emotional connection and localized intelligence to EchoVerse.",
    number: "02",
    tagColor: "from-emerald-500 to-teal-500",
  },
  {
    image: "/model3.jpg",
    title: "EchoVerse Model 3",
    archetype: "British Sophisticated",
    accent: "en-GB",
    sampleText: "Greetings. I am EchoVerse Model 3. Poised, sophisticated, and at your command.",
    description:
      "An elegant and articulate AI with a refined British accent. Featuring a poised tone, it delivers answers with sophistication and immersive presence.",
    number: "03",
    tagColor: "from-purple-500 to-rose-500",
  },
];

const Models = () => {
  const [index, setIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const router = useRouter();

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
    <div className="w-screen h-screen overflow-hidden bg-[#07070e] text-white relative">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-cyan-600/10 rounded-full blur-[120px] top-10 left-10 animate-pulse" />
        <div className="absolute w-[450px] h-[450px] bg-gradient-to-r from-pink-600/10 via-purple-600/15 to-blue-600/10 rounded-full blur-[140px] bottom-10 right-10" />
      </div>

      <motion.div
        className="flex h-screen w-full"
        animate={{ x: `-${index * 100}vw` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {avatars.map((m, i) => (
          <section
            key={m.number}
            className="flex-shrink-0 w-screen h-screen flex justify-center items-center relative p-6 md:p-12"
          >
            {/* Big background number */}
            <div className="z-0 absolute left-[3vw] top-1/2 -translate-y-1/2 text-[20rem] md:text-[28rem] font-black text-white/[0.03] leading-none pointer-events-none select-none tracking-tighter">
              {m.number}
            </div>

            {/* Main Avatar Card */}
            <motion.div
              className="relative z-10 w-full max-w-4xl h-[80vh] md:h-[82vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-2xl p-6 md:p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: i === index ? 1 : 0.25,
                scale: i === index ? 1 : 0.96,
              }}
              transition={{ duration: 0.5 }}
            >
              {/* Top Bar inside Card */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gradient-to-r ${m.tagColor} text-white shadow-sm`}>
                    {m.archetype}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">MODEL {m.number} / 03</span>
                </div>

                {/* Voice Preview Button */}
                <button
                  onClick={() => playVoicePreview(m)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    isPlayingAudio
                      ? "bg-purple-600/30 border-purple-500 text-purple-300 animate-pulse"
                      : "bg-zinc-900/80 border-zinc-700/80 hover:border-indigo-500/60 text-zinc-300 hover:text-white"
                  }`}
                  title="Listen to voice preview"
                >
                  <Volume2 className="size-3.5" />
                  <span>{isPlayingAudio ? "Playing Voice..." : "Preview Voice"}</span>
                </button>
              </div>

              {/* Avatar Image Frame */}
              <div className="relative flex-1 w-full my-4 rounded-2xl overflow-hidden border border-zinc-800/50 bg-black/40">
                <Image
                  src={m.image}
                  alt={m.title}
                  fill
                  className="object-cover transition-transform duration-1000 ease-out hover:scale-103"
                  priority={i === 0}
                />
              </div>

              {/* Card Bottom: Description & Select Action */}
              <div className="z-10 flex flex-col gap-4">
                <p className="leading-relaxed text-sm md:text-base text-zinc-300 max-w-2xl font-normal">
                  {m.description}
                </p>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={handleSelect}
                    className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:brightness-110 shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm md:text-base"
                  >
                    <Check className="size-4" />
                    <span>Select {m.title}</span>
                  </button>

                  {/* Model Switcher Arrows */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevModel}
                      aria-label="Previous model"
                      className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 transition-all text-white hover:scale-105 cursor-pointer"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={nextModel}
                      aria-label="Next model"
                      className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 transition-all text-white hover:scale-105 cursor-pointer"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        ))}
      </motion.div>

      {/* Bottom Center Indicator Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {avatars.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => {
              stopPreview();
              setIndex(dotIdx);
            }}
            aria-label={`Jump to model ${dotIdx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              dotIdx === index
                ? "w-8 h-2 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Models;
