"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const ChooseName = () => {
  const [name, setName] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/user/assistant1",
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
    if (!name.trim()) return;
    try {
      await axios.put(
        "http://localhost:8000/api/user/assistant",
        { assistantName: name.trim() },
        { withCredentials: true }
      );
      router.push("/Mainpage");
    } catch (err: any) {
      console.error("Error saving assistant name:", err.response?.data || err);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-8 relative overflow-hidden">
      {/* Glowing background blobs */}
      <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse top-[-15%] left-[-10%]" />
      <div className="absolute w-80 h-80 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-3xl opacity-20 animate-bounce bottom-[-10%] right-[-10%]" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        {/* Left side: model image */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {model ? (
              <motion.div
                key={model}
                initial={{ opacity: 0, x: -100 }} // <-- from left
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }} // <-- exit to right
                transition={{ duration: 0.7 }}
                className="relative p-6 rounded-3xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20"
              >
                <Image
                  src={model}
                  alt="Chosen Assistant Model"
                  width={480}
                  height={470}
                  className="rounded-2xl object-contain transition-transform duration-500 hover:scale-105"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60 text-lg italic"
              >
                Loading your model...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: name input */}
        <div className="text-white space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Give Your Assistant a Name ✨
            </h1>
            <p className="text-lg text-gray-300">
              Personalize your AI with a unique identity. This is how your
              companion will introduce itself everywhere.
            </p>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg w-full max-w-md">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Assistant Name"
                className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-400 outline-none"
              />
              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className={`px-6 py-2 font-semibold rounded-xl transition-all ${
                  name.trim()
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover:scale-105"
                    : "bg-gray-500/40 text-gray-300 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChooseName;
