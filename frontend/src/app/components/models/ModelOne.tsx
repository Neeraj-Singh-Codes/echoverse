"use client";

import Spline from "@splinetool/react-spline";
import { MutableRefObject } from "react";

// ----------------- Speech function -----------------
export const modelOneSpeak = (
  text: string,
  isSpeakingRef: MutableRefObject<boolean>,
  startRecognition: () => void
) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 1;
  utterance.rate = 1;

  utterance.onend = () => {
    isSpeakingRef.current = false;
    startRecognition();
  };

  isSpeakingRef.current = true;
  speechSynthesis.speak(utterance);
};

// ----------------- Props Interface -----------------
interface ModelOneProps {
  isSpeakingRef: MutableRefObject<boolean>;
  startRecognition: () => void;
}

// ----------------- Component -----------------
const ModelOne = ({ isSpeakingRef, startRecognition }: ModelOneProps) => {
  return (
    <div className="flex flex-col items-center w-full max-w-[600px] h-[600px]">
      <Spline
        scene="https://prod.spline.design/5afuBa4SySGVP6Lu/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ModelOne;
