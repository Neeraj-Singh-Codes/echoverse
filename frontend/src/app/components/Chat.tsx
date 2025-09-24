"use client";

import { useEffect, useRef, useState } from "react";
import { X, SendHorizonal } from "lucide-react";


interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<string>;
}

const Chat = ({ isOpen, onClose, onSend }: ChatModalProps) => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Ref to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  // 🔊 speak text using SpeechSynthesis API
  const speak = (text: string) => {
    if (!soundEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // change to "hi-IN" for Hindi
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const response = await onSend(input);
    const botMsg = { role: "assistant", text: response };
    setMessages((prev) => [...prev, botMsg]);

    speak(response);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blur background */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat window */}
      <div className="relative z-10 bg-gray-900 text-white w-[50%] h-[70%] rounded-2xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chat with AI</h2>

          {/* ✅ Sound toggle */}
          <label className="swap cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            {/* volume on */}
            <svg
              className="swap-on fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
            >
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
            </svg>
            {/* volume off */}
            <svg
              className="swap-off fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
            >
              <path d="M3,9H7L12,4V20L7,15H3V9M16.59,12L14,9.41L15.41,8L18,10.59L20.59,8L22,9.41L19.41,12L22,14.59L20.59,16L18,13.41L15.41,16L14,14.59L16.59,12Z" />
            </svg>
          </label>

          <X className="cursor-pointer" onClick={onClose} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg max-w-[40%] ${
                msg.role === "user"
                  ? "bg-indigo-600 ml-auto text-left"
                  : "bg-gray-700 mr-auto text-left"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input fixed at bottom */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-gray-700 px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
          >
            <SendHorizonal className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
