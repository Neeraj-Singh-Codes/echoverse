"use client";

import { MutableRefObject } from "react";

// Robust voice finder across Chrome, Brave, Firefox, Safari, Edge, Android & iOS
export const getBestVoice = (targetLang: string, voiceKeywords: string[]): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Exact language match (e.g., 'hi-IN', 'en-GB', 'en-US')
  let match = voices.find(
    (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.replace("_", "-").toLowerCase() === targetLang.toLowerCase()
  );
  if (match) return match;

  // 2. Keyword match in voice name (e.g. 'hindi', 'british', 'uk', 'india', 'natural')
  for (const keyword of voiceKeywords) {
    const kwMatch = voices.find((v) => v.name.toLowerCase().includes(keyword.toLowerCase()));
    if (kwMatch) return kwMatch;
  }

  // 3. Language prefix match (e.g. 'hi', 'en')
  const prefix = targetLang.split("-")[0].toLowerCase();
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  return voices[0] || null;
};

// Split long text into natural sentence chunks to prevent Firefox/Safari 200-char cutoff
const splitIntoSentences = (text: string): string[] => {
  const cleaned = text.replace(/[*#_`]/g, "").trim();
  if (cleaned.length <= 150) return [cleaned];

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!sentences) return [cleaned];

  const result: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (buffer.length + trimmed.length < 150) {
      buffer += (buffer ? " " : "") + trimmed;
    } else {
      if (buffer) result.push(buffer);
      buffer = trimmed;
    }
  }
  if (buffer) result.push(buffer);
  return result.length > 0 ? result : [cleaned];
};

interface UniversalSpeakOptions {
  text: string;
  lang: string;
  voiceKeywords: string[];
  pitch?: number;
  rate?: number;
  isSpeakingRef: MutableRefObject<boolean>;
  startRecognition?: () => void;
  onFinish?: () => void;
}

export const universalSpeak = ({
  text,
  lang,
  voiceKeywords,
  pitch = 1,
  rate = 1,
  isSpeakingRef,
  startRecognition,
  onFinish,
}: UniversalSpeakOptions) => {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onFinish) onFinish();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const chunks = splitIntoSentences(text);
  let currentChunkIndex = 0;

  isSpeakingRef.current = true;
  (window as any)._activeUtterances = [];

  const handleAllFinished = () => {
    isSpeakingRef.current = false;
    (window as any)._activeUtterances = null;
    if (onFinish) onFinish();
    if (startRecognition) startRecognition();
  };

  const playNextChunk = () => {
    if (currentChunkIndex >= chunks.length) {
      handleAllFinished();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    currentChunkIndex++;

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = lang;
    utterance.pitch = pitch;
    utterance.rate = rate;

    const matchedVoice = getBestVoice(lang, voiceKeywords);
    if (matchedVoice) utterance.voice = matchedVoice;

    (window as any)._activeUtterances = [(window as any)._activeUtterances || [], utterance];

    utterance.onend = () => {
      playNextChunk();
    };

    utterance.onerror = (e) => {
      console.warn("[TTS Chunk Warning]:", e);
      // Still advance to next chunk or finish gracefully
      playNextChunk();
    };

    // Ensure audio plays even if voices are still asynchronously loading (Safari/Firefox)
    if (synth.speaking && currentChunkIndex === 1) {
      synth.cancel();
    }
    synth.speak(utterance);
  };

  // If voices aren't loaded yet (Firefox/Safari), wait for onvoiceschanged
  if (synth.getVoices().length === 0) {
    const onVoicesLoaded = () => {
      synth.onvoiceschanged = null;
      playNextChunk();
    };
    synth.onvoiceschanged = onVoicesLoaded;
    // Timeout fallback if onvoiceschanged doesn't trigger
    setTimeout(() => {
      if (currentChunkIndex === 0) playNextChunk();
    }, 250);
  } else {
    playNextChunk();
  }
};
