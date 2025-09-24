"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { ChevronRight } from "lucide-react"; // icon for next

const avatars = [
  {
    image: "/model1.jpg",
    title: "EchoVerse Model 1",
    description: "The futuristic AI with glowing details and sleek design.",
    number: "01",
  },
  {
    image: "/echoverse-avatar.jpg",
    title: "EchoVerse Model 2",
    description: "Dynamic second assistant with strong sci-fi vibes.",
    number: "02",
  },
  {
    image: "/model3.jpg",
    title: "EchoVerse Model 3",
    description: "Minimalist but powerful design for immersive experiences.",
    number: "03",
  },
  {
    image: "/echoverse-avatar.jpg",
    title: "EchoVerse Model 4",
    description: "Elegant and bold with glowing effects to stand out.",
    number: "04",
  },
];

const Models = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [index, setIndex] = useState(0);
  const router = useRouter();

  // cycle forward & loop
  const nextModel = () => {
    setIndex((prev) => (prev + 1) % avatars.length);
  };

  // Save model → ChooseName
  const handleSelect = async () => {
    try {
      await axios.put(
        "http://localhost:8000/api/user/assistant",
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
      <div className="fixed inset-0 z-0">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + "px",
            top: mousePosition.y * 0.02 + "px",
            transform: "translate(-50%, -50%)",
          }}
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
                />
              </div>
              <div className="z-10 flex items-center justify-between ">
                {/* Left side: Select button */}
                <button
                  onClick={handleSelect}
                  className="fancy-btn px-8 py-4 mt-10 border-2 border-purple-500 font-bold text-white bg-transparent text-xl"
                >
                  Select {m.title}
                </button>
                {/* Right side: Next icon */}
                <button
                  onClick={nextModel}
                  className=" z-12 p-3 rounded-full bg-gray-600 hover:bg-purple-500 transition-all shadow-lg hover:scale-110 mt-10"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Info + buttons row */}
            </motion.div>
          </section>
        ))}
      </motion.div>
    </div>
  );
};

export default Models;
