"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const ChooseName = () => {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleNext = async () => {
    if (!name.trim()) return;

    try {
      await axios.put(
        "http://localhost:8000/api/user/assistant",
        { assistantName: name.trim() },
        { withCredentials: true } // important to send JWT cookie
      );

      router.push("/Mainpage"); // go to main page
    } catch (err: any) {
      console.error("Error saving assistant name:", err.response?.data || err);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center bg-gradient-to-t from-[#5e2f5e] via-[#c1c1da] to-[#2d4d4d] px-4">
      <h1 className="text-3xl md:text-4xl mt-20 font-bold text-white text-center">
        Choose a Name for Your Assistant
      </h1>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col sm:flex-row gap-4 bg-white/20 p-6 rounded-2xl shadow-lg backdrop-blur-md">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Assistant Name"
            className="px-4 py-2 rounded-xl outline-none text-gray-800 w-64 focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={handleNext}
            disabled={!name.trim()}
            className={`px-6 py-2 font-semibold rounded-xl transition-all ${
              name.trim()
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseName;
