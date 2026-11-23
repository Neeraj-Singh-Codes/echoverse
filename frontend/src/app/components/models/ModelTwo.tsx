"use client";

import React, { memo } from "react";
import Spline from "@splinetool/react-spline";
import { universalSpeak } from "./speechHelper";

export const modelTwoSpeak = (
  text: string,
  isSpeakingRef: React.MutableRefObject<boolean>,
  startRecognition?: () => void,
  onFinish?: () => void
) => {
  universalSpeak({
    text,
    lang: "hi-IN",
    voiceKeywords: ["hindi", "kalpana", "hemant", "lekha", "neel", "हिन्दी", "india"],
    pitch: 0.9,
    rate: 0.95,
    isSpeakingRef,
    startRecognition,
    onFinish,
  });
};

const ModelTwo = memo(({
  isSpeakingRef,
  startRecognition,
}: {
  isSpeakingRef: any;
  startRecognition: any;
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[460px] h-[300px] md:h-[380px] relative pointer-events-auto select-none transition-all duration-300">
      <Spline
        scene="https://prod.spline.design/WZXeiBX2HIsi8Xz1/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
});

ModelTwo.displayName = "ModelTwo";

export default ModelTwo;
