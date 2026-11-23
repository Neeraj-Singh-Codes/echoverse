"use client";

import React, { memo } from "react";
import Spline from "@splinetool/react-spline";
import { universalSpeak } from "./speechHelper";

export const modelThreeSpeak = (
  text: string,
  isSpeakingRef: React.MutableRefObject<boolean>,
  startRecognition?: () => void,
  onFinish?: () => void
) => {
  universalSpeak({
    text,
    lang: "en-GB",
    voiceKeywords: ["british", "uk", "daniel", "oliver", "george", "serena", "hazel"],
    pitch: 1.3,
    rate: 0.95,
    isSpeakingRef,
    startRecognition,
    onFinish,
  });
};

const ModelThree = memo(({ isSpeakingRef, startRecognition }: { isSpeakingRef: any; startRecognition: any }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[460px] h-[300px] md:h-[380px] relative pointer-events-auto select-none transition-all duration-300">
      <Spline
        scene="https://prod.spline.design/hLFE1KeH865ijwWz/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
});

ModelThree.displayName = "ModelThree";

export default ModelThree;
