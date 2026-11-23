"use client";

import { useEffect, useRef, useState } from "react";
import { X, SendHorizonal, Volume2, VolumeX, Sparkles, Bot, User } from "lucide-react";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<string>;
}

const SUGGESTIONS = [
  "Search Joey's pizza on maps",
  "What is EchoVerse?",
  "What time is it right now?",
  "Open Blackboard for me",
];

const Chat = ({ isOpen, onClose, onSend }: ChatModalProps) => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaiting]);

  if (!isOpen) return null;

  // Speak text using SpeechSynthesis API (chat voice only)
  const speak = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    const chatVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Female"))) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (chatVoice) utterance.voice = chatVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    synth.cancel();
    synth.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isWaiting) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsWaiting(true);

    try {
      const response = await onSend(query);
      const botMsg = { role: "assistant", text: response };
      setMessages((prev) => [...prev, botMsg]);
      speak(response);
    } catch {
      const errorMsg = { role: "assistant", text: "I'm having trouble thinking right now. Please try again." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsWaiting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Glassmorphic Cyber Modal */}
      <div className="relative z-10 bg-zinc-950/90 border border-zinc-800/80 text-white w-full max-w-2xl h-[75vh] max-h-[700px] rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 tracking-wide flex items-center gap-2">
                EchoVerse Intelligence
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-zinc-400">Ask anything or issue a command</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? "Mute Voice" : "Unmute Voice"}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                soundEnabled
                  ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60"
                  : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-indigo-400 shadow-inner">
                <Sparkles className="size-7 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">How can I assist you today?</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Search maps, play music, look up facts, or control your EchoVerse workspace.
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-md">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item)}
                    className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-900/80 hover:bg-indigo-950/70 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-200 transition-all duration-200 cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 animate-in fade-in duration-200 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role !== "user" && (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                  <Bot className="size-3.5" />
                </div>
              )}

              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[80%] md:max-w-[70%] break-words shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs"
                    : "bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-tl-xs shadow-zinc-950/50"
                }`}
              >
                {msg.text}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300">
                  <User className="size-3.5" />
                </div>
              )}
            </div>
          ))}

          {isWaiting && (
            <div className="flex items-start gap-3 animate-in fade-in duration-150">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                <Bot className="size-3.5" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 rounded-tl-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-zinc-800/80 bg-zinc-900/30 p-3 sm:px-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isWaiting}
            placeholder={isWaiting ? "Thinking..." : "Type your query or command..."}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isWaiting || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <SendHorizonal className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
