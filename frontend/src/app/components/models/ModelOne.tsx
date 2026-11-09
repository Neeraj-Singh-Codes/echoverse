"use client";

import Spline from "@splinetool/react-spline";
import { MutableRefObject } from "react";
import { universalSpeak } from "./speechHelper";

// ----------------- Speech function -----------------
export const modelOneSpeak = (
  text: string,
  isSpeakingRef: MutableRefObject<boolean>,
  startRecognition?: () => void,
  onFinish?: () => void
) => {
  universalSpeak({
    text,
    lang: "en-US",
    voiceKeywords: ["natural", "google us", "samantha", "david", "zira", "english"],
    pitch: 1.0,
    rate: 1.0,
    isSpeakingRef,
    startRecognition,
    onFinish,
  });
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
