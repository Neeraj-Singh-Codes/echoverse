"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { getApiUrl } from "../utils/apiUrl";

const SUGGESTIONS = ["Echo", "Jarvis", "Nova", "Maya", "Astra", "Friday"];

const ChooseName = () => {
  const [name, setName] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const res = await axios.get(
          `${getApiUrl()}/api/user/assistant1`,
          {
            withCredentials: true,
          }
        );
        if (res.data?.assistantImage) setModel(res.data.assistantImage);
        if (res.data?.assistantName) setName(res.data.assistantName);
      } catch (err) {
        console.error("Error fetching assistant:", err);
      }
    };
    fetchAssistant();
  }, []);

  const handleNext = async () => {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(
        `${getApiUrl()}/api/user/assistant`,
        { assistantName: name.trim() },
        { withCredentials: true }
      );
      router.push("/Mainpage");
    } catch (err: any) {
      console.error("Error saving assistant name:", err.response?.data || err);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#07070e] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Glowing background ambient halos */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-cyan-600/10 rounded-full blur-[120px] top-[-10%] left-[-10%] animate-pulse pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-r from-pink-600/10 via-purple-600/15 to-blue-600/10 rounded-full blur-[140px] bottom-[-10%] right-[-10%] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 max-w-5xl w-full items-center">
        {/* Left side: Model preview stage */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {model ? (
              <motion.div
                key={model}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="relative p-3 rounded-3xl bg-zinc-950/70 backdrop-blur-2xl shadow-2xl border border-zinc-800/80 group overflow-hidden"
              >
                {/* Glow ring behind avatar */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden bg-black/40">
                  <Image
                    src={model}
                    alt="Chosen Assistant Model"
                    width={440}
                    height={430}
                    className="rounded-2xl object-cover transition-transform duration-700 group-hover:scale-103"
                    priority
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-zinc-500 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span>Loading chosen model...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: Name input & suggestions */}
        <div className="text-white space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Identity Customization</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
              Name Your Companion
            </h1>

            <p className="text-sm md:text-base text-zinc-400 font-normal leading-relaxed">
              Give your AI companion an identity. This is the wake name you will speak to activate your assistant.
            </p>

            {/* Input field */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 focus-within:border-indigo-500/80 p-2 rounded-2xl shadow-xl backdrop-blur-xl transition-all">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Echo, Jarvis, Nova"
                className="flex-1 px-4 py-2 bg-transparent text-white placeholder-zinc-500 outline-none text-base"
                autoFocus
              />
              <button
                onClick={handleNext}
                disabled={!name.trim() || isSubmitting}
                className={`flex items-center gap-1.5 px-6 py-2.5 font-semibold text-sm rounded-xl transition-all cursor-pointer ${
                  name.trim() && !isSubmitting
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:brightness-110 hover:scale-102"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <span>{isSubmitting ? "Saving..." : "Continue"}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-zinc-500">Popular Suggestions:</span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setName(sug)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      name.toLowerCase() === sug.toLowerCase()
                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/60"
                        : "bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChooseName;
