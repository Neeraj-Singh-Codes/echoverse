"use client";

import React, { useState } from "react";
import Card from "@/app/components/Card";
import { useRouter } from "next/navigation";
import axios from "axios";

const Models = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();

  const avatars = [
    {
      image: "/model1.jpg",
    },
    {
      image: "/echoverse-avatar.jpg",
    },
    {
      image: "/model3.jpg",
    },
    {
      image: "/echoverse-avatar.jpg",
    },
  ];

  const handleNext = async () => {
    if (selected !== null) {
      try {
        // Save only the image in backend
        await axios.put(
          "http://localhost:8000/api/user/assistant",
          { assistantImage: avatars[selected].image }, // store just the image
          { withCredentials: true }
        );

        router.push("/ChooseName");
      } catch (err: any) {
        console.error("Error saving avatar:", err.response?.data || err);
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-8 bg-black">
      <div className="flex gap-8">
        {avatars.map((avatar, index) => (
          <Card
            key={index}
            image={avatar.image} // pass only the image to Card
            isSelected={selected === index}
            onClick={() => setSelected(index)}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selected === null}
        className={`w-40 rounded-md py-3 font-semibold transition-all duration-300 mt-1
          ${
            selected === null
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:scale-105 hover:shadow-lg"
          }`}
      >
        Select Avatar
      </button>
    </div>
  );
};

export default Models;
