"use client";

import Spline from "@splinetool/react-spline";

export const modelThreeSpeak = (
  text: string,
  isSpeakingRef: React.MutableRefObject<boolean>,
  startRecognition: () => void
) => {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.pitch = 1.3;
  utterance.rate = 0.95;

  utterance.onend = () => {
    isSpeakingRef.current = false;
    startRecognition();
  };

  isSpeakingRef.current = true;
  speechSynthesis.speak(utterance);
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
