"use client";

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

const ModelThree = ({ isSpeakingRef, startRecognition }: { isSpeakingRef: any; startRecognition: any }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-[600px] h-[600px]">
      <Spline
        scene="https://prod.spline.design/hLFE1KeH865ijwWz/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ModelThree;
