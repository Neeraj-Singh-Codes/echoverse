"use client";

import React, { memo, MutableRefObject } from "react";
import Spline from "@splinetool/react-spline";
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
const ModelOne = memo(({ isSpeakingRef, startRecognition }: ModelOneProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[620px] h-[480px] md:h-[540px] relative pointer-events-auto select-none transition-all duration-300">
      <Spline
        scene="https://prod.spline.design/5afuBa4SySGVP6Lu/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
});

ModelOne.displayName = "ModelOne";

export default ModelOne;
