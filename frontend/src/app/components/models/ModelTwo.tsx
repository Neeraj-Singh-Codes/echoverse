"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Spline from "@splinetool/react-spline";

export const modelTwoSpeak = (
  text: string,
  isSpeakingRef: React.MutableRefObject<boolean>,
  startRecognition: () => void
) => {
  if (!text) return;
  speechSynthesis.cancel();
  if ((window as any).speechRecognitionInstance) {
    try {
      (window as any).speechRecognitionInstance.stop();
    } catch {}
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  utterance.pitch = 0.9;
  utterance.rate = 0.95;

  const voices = speechSynthesis.getVoices();
  const hindiVoice =
    voices.find((v) => v.lang === "hi-IN") ||
    voices.find((v) => v.name.toLowerCase().includes("hindi"));
  if (hindiVoice) utterance.voice = hindiVoice;

  utterance.onend = () => {
    isSpeakingRef.current = false;
    startRecognition();
  };

  isSpeakingRef.current = true;
  speechSynthesis.speak(utterance);
};

const ModelTwo = ({
  isSpeakingRef,
  startRecognition,
}: {
  isSpeakingRef: any;
  startRecognition: any;
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-[600px] h-[600px]">
      <Spline
        scene="https://prod.spline.design/WZXeiBX2HIsi8Xz1/scene.splinecode"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ModelTwo;
