"use client";
import React, { useState, useEffect } from "react";
import {
  Mic,
  MessageCircle,
  Brain,
  Zap,
  Star,
  ArrowRight,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: any) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const toggleDemo = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + "px",
            top: mousePosition.y * 0.02 + "px",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-3xl opacity-15 animate-bounce"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Echoverse
          </div>
          <div className="hidden md:flex space-x-8">
            <a
              href="#features"
              className="hover:text-purple-400 transition-colors"
            >
              Features
            </a>
            <a href="#demo" className="hover:text-purple-400 transition-colors">
              Demo
            </a>

            <a
              href="#contact"
              className="hover:text-purple-400 transition-colors"
            >
              Contact
            </a>
          </div>
          <Link href={"/Signup"}>
            <button className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105">
              Get Started
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8 inline-flex items-center px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm">Powered by Advanced AI</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            Meet Your AI
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Voice Assistant
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of conversation with Echoverse - an
            intelligent AI assistant that listens, understands, and responds
            naturally through voice and chat.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center group">
              Start Conversation
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href={"/Signin"}>
              <button
                onClick={toggleDemo}
                className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all flex items-center justify-center group"
              >
                Sign In
              </button>
            </Link>
          </div>

          {/* Voice Visualization */}
          <div className="relative mx-auto w-64 h-32 mb-16">
            <div className="absolute inset-0 flex items-center justify-center space-x-1">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-t from-purple-500 to-blue-400 rounded-full transition-all duration-300 ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    width: "4px",
                    height: `${Math.random() * 60 + 20}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful AI Capabilities
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built with cutting-edge TTS, STT, and AI APIs to deliver seamless
              conversational experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic className="w-8 h-8" />,
                title: "Speech-to-Text",
                description:
                  "Advanced voice recognition that understands natural speech patterns and converts them to text with high accuracy.",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: <Volume2 className="w-8 h-8" />,
                title: "Text-to-Speech",
                description:
                  "Natural-sounding voice synthesis that brings responses to life with human-like intonation and clarity.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "AI Intelligence",
                description:
                  "Powered by advanced AI models that understand context, provide intelligent responses, and learn from interactions.",
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 group"
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See Echoverse in Action
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Experience the seamless integration of voice, chat, and AI
            intelligence
          </p>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-3 text-blue-400" />
                  Voice & Chat Interface
                </h3>
                <p className="text-gray-300 mb-4">
                  Switch seamlessly between voice commands and text chat.
                  Echoverse understands both and responds naturally in your
                  preferred format.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Online & Ready
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-black/30 rounded-2xl p-6 border border-white/10">
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-purple-500 text-white px-4 py-2 rounded-2xl max-w-xs">
                      "What's the weather like today?"
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl max-w-xs">
                      It's sunny with a high of 72°F. Perfect weather for
                      outdoor activities!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "99.9%", label: "Voice Accuracy" },
              { number: "<100ms", label: "Response Time" },
              { number: "Interactive", label: "Models" },
              { number: "24/7", label: "Availability" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Talking?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Unlock the Power of Customizable Personal Voice and Chat Assistant
              AI-driven conversation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center group">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Echoverse
          </div>
          <p className="text-gray-400 mb-6">
            The future of AI conversation is here
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
