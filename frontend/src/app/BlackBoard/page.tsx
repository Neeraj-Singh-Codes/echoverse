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
} from "lucide-react";

export default function BlackBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [boardColor, setBoardColor] = useState("#1a1a1a"); // Default blackboard

  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Initialize Canvas (preserve strokes when switching board)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 0.6;
    canvas.height = window.innerHeight * 0.7;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // preserve strokes
    const snapshot = canvas.toDataURL();
    const img = new Image();
    img.src = snapshot;
    img.onload = () => {
      ctx.fillStyle = boardColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
  }, [boardColor]);

  // Save snapshot to history
  const saveState = () => {
    if (!canvasRef.current) return;
    const snapshot = canvasRef.current.toDataURL();
    setHistory((prev) => [...prev, snapshot]);
    setRedoStack([]); // clear redo after new action
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent) => {
    ctxRef.current?.beginPath();
    ctxRef.current?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    ctxRef.current?.closePath();
    setIsDrawing(false);
    saveState();
  };

  // Draw
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    ctxRef.current!.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current!.stroke();
  };

  // Clear board
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

  // Undo
  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRedoStack((prev) => [...prev, lastState]);
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const img = new Image();
    img.src = newHistory[newHistory.length - 1] || "";
    img.onload = () => {
      ctxRef.current?.drawImage(img, 0, 0);
    };
  };

  // Redo
  const redo = () => {
    if (redoStack.length === 0) return;
    const restoredState = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory((prev) => [...prev, restoredState]);

    const img = new Image();
    img.src = restoredState;
    img.onload = () => {
      ctxRef.current?.drawImage(img, 0, 0);
    };
  };

  // Eraser Mode
  const enableEraser = () => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = boardColor;
    }
  };

  // Pen Mode
  const enablePen = () => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  };

  // Download board
  const downloadBoard = () => {
    const link = document.createElement("a");
    link.download = "board.png";
    link.href = canvasRef.current!.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="rounded-2xl cursor-crosshair"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg">
        {/* Color Picker */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 shadow-inner">
          <Palette className="w-5 h-5 text-white" />
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (ctxRef.current) ctxRef.current.strokeStyle = e.target.value;
            }}
            className="w-8 h-8 rounded-full cursor-pointer border-none"
          />
        </label>

        {/* Brush Size */}
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
          className="w-28 accent-blue-500"
        />

        {/* Tools */}
        <button
          onClick={enablePen}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
        >
          <PenLine size={18} /> Pen
        </button>
        <button
          onClick={enableEraser}
          className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-1"
        >
          <Eraser size={18} /> Eraser
        </button>

        {/* Undo / Redo */}
        <button
          onClick={undo}
          className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white flex items-center gap-1"
        >
          <Undo2 size={18} /> Undo
        </button>
        <button
          onClick={redo}
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
        >
          <Redo2 size={18} /> Redo
        </button>

        {/* Clear */}
        <button
          onClick={clearBoard}
          className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-1"
        >
          <Trash2 size={18} /> Clear
        </button>

        {/* Save */}
        <button
          onClick={downloadBoard}
          className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white flex items-center gap-1"
        >
          <Download size={18} /> Save
        </button>

        {/* Switch Board */}
        <button
          onClick={() =>
            setBoardColor(boardColor === "#1a1a1a" ? "#ffffff" : "#1a1a1a")
          }
          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
        >
          <RefreshCw size={18} /> Switch Board
        </button>
      </div>
    </div>
  );
}
