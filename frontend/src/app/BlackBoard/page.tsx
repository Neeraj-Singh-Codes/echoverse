"use client";
import { useRef, useState, useEffect } from "react";
import {
  Undo2,
  Redo2,
  Eraser,
  PenLine,
  Download,
  Trash2,
  Palette,
  RefreshCw,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { div } from "framer-motion/client";
import Link from "next/link";
import Mainpage from "../Mainpage/page";

export default function BlackBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#a78bfa");
  const [lineWidth, setLineWidth] = useState(3);
  const [boardColor, setBoardColor] = useState("#0f0a1f");
  const [activeTool, setActiveTool] = useState("pen");

  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = Math.min(window.innerWidth * 0.85, 1200);
    canvas.height = Math.min(window.innerHeight * 0.65, 700);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const snapshot = canvas.toDataURL();
    const img = new Image();
    img.src = snapshot;
    img.onload = () => {
      ctx.fillStyle = boardColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
  }, [boardColor, color, lineWidth]);

  const saveState = () => {
    if (!canvasRef.current) return;
    const snapshot = canvasRef.current.toDataURL();
    setHistory((prev) => [...prev, snapshot]);
    setRedoStack([]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    if (ctxRef.current) ctxRef.current.closePath();
    setIsDrawing(false);
    saveState();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current) return;
    ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.stroke();
  };

  const clearBoard = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.fillStyle = boardColor;
    ctxRef.current.fillRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    saveState();
  };

  const undo = () => {
    if (history.length === 0 || !canvasRef.current || !ctxRef.current) return;
    setRedoStack((prev) =>
      canvasRef.current ? [...prev, canvasRef.current.toDataURL()] : prev
    );

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    if (newHistory.length === 0) {
      ctxRef.current.fillStyle = boardColor;
      ctxRef.current.fillRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    } else {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        if (!ctxRef.current || !canvasRef.current) return;
        ctxRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        ctxRef.current.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (redoStack.length === 0 || !ctxRef.current || !canvasRef.current) return;
    const restoredState = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setRedoStack((prev) =>
      canvasRef.current ? [...prev, canvasRef.current.toDataURL()] : prev
    );

    const img = new Image();
    img.src = restoredState;
    img.onload = () => {
      if (!ctxRef.current || !canvasRef.current) return;
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  const enableEraser = () => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = boardColor;
      setActiveTool("eraser");
    }
  };

  const enablePen = () => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      setActiveTool("pen");
    }
  };

  const downloadBoard = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `board-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-8">
      
        <div className="w-full">
          <Link href={"Mainpage"}>
          <ArrowLeft className="size-9" />
          </Link>
        </div>
      
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
          Digital Canvas
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
        </h1>
        <p className="text-purple-300 mt-2 text-sm">Create, express, inspire</p>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-1 backdrop-blur-sm mb-6 transition-all duration-300 hover:shadow-purple-500/20">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="rounded-2xl cursor-crosshair"
          style={{ backgroundColor: boardColor }}
        />
      </div>

      <div className="w-full max-w-5xl">
        <div className="bg-gradient-to-r from-purple-900/40 via-slate-900/40 to-purple-900/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-purple-500/20">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <div className="group relative">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105">
                <Palette className="w-5 h-5 text-purple-300" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (ctxRef.current && activeTool === "pen") {
                      ctxRef.current.strokeStyle = e.target.value;
                    }
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-purple-400/50"
                />
                <span className="text-purple-200 text-sm font-medium">
                  Color
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 shadow-lg">
              <span className="text-purple-200 text-sm font-medium whitespace-nowrap">
                Size: {lineWidth}px
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => {
                  setLineWidth(Number(e.target.value));
                  if (ctxRef.current)
                    ctxRef.current.lineWidth = Number(e.target.value);
                }}
                className="w-32 h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <button
              onClick={enablePen}
              className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 shadow-lg ${
                activeTool === "pen"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-105 shadow-purple-500/50"
                  : "bg-purple-600/20 text-purple-200 border border-purple-500/30 hover:bg-purple-600/30 hover:scale-105"
              }`}
            >
              <PenLine size={18} /> Pen
            </button>

            <button
              onClick={enableEraser}
              className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 shadow-lg ${
                activeTool === "eraser"
                  ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white scale-105 shadow-slate-500/50"
                  : "bg-slate-600/20 text-purple-200 border border-purple-500/30 hover:bg-slate-600/30 hover:scale-105"
              }`}
            >
              <Eraser size={18} /> Eraser
            </button>

            <button
              onClick={undo}
              disabled={history.length === 0}
              className="px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-amber-200 border border-amber-500/30 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <Undo2 size={18} /> Undo
            </button>

            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="px-4 py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-violet-200 border border-violet-500/30 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <Redo2 size={18} /> Redo
            </button>

            <button
              onClick={clearBoard}
              className="px-4 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-500/30 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <Trash2 size={18} /> Clear
            </button>

            <button
              onClick={downloadBoard}
              className="px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <Download size={18} /> Save
            </button>

            <button
              onClick={() =>
                setBoardColor(boardColor === "#0f0a1f" ? "#f8f9fa" : "#0f0a1f")
              }
              className="px-4 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <RefreshCw size={18} /> Switch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
