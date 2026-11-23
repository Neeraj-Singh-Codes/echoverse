import { response } from "express";
import geminiResponse from "../gemini.js";
import User from "../model/userModel.js";
import moment from "moment";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, assistantImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "Update Assistant Error" });
  }
};

export const fetchModel = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // use userId from isAuth
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      assistantImage: user.assistantImage || null,
      assistantName: user.assistantName || "",
    });
  } catch (err) {
    console.error("Fetch model error:", err);
    res.status(500).json({ message: "Error fetching model" });
  }
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    const userName = user?.name || "User";
    const assistantName = user?.assistantName || "Assistant";
    const result = await geminiResponse(command, assistantName, userName);
    const jsonMatch = typeof result === "string" ? result.match(/{[\s\S]*}/) : null;

    let gemResult = null;
    if (jsonMatch) {
      try {
        gemResult = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.warn("[JSON Parse Warning]:", parseError.message);
      }
    }

    if (!gemResult || !gemResult.response) {
      const lower = (command || "").toLowerCase();
      let fallbackType = "general";
      let fallbackInput = command;
      let fallbackResponse =
        typeof result === "string" && result.trim()
          ? result.replace(/```json|```/g, "").trim()
          : "Searching for that right now.";

      if (lower.includes("map") || lower.includes("maps") || lower.includes("directions to")) {
        fallbackType = "maps-search";
        fallbackInput = command
          .replace(/can you please\s*/i, "")
          .replace(/please\s*/i, "")
          .replace(/search for\s*/i, "")
          .replace(/search\s*/i, "")
          .replace(/\s*(on|in)\s*maps?/i, "")
          .trim();
        fallbackResponse = `Sure, searching for ${fallbackInput} on Google Maps.`;
      } else if (lower.includes("google") || lower.includes("search for")) {
        fallbackType = "google-search";
        fallbackInput = command.replace(/google\s*/i, "").replace(/search for\s*/i, "").trim();
        fallbackResponse = `Searching Google for ${fallbackInput}.`;
      } else if (lower.includes("play") && lower.includes("youtube")) {
        fallbackType = "youtube-play";
        fallbackInput = command.replace(/play\s*/i, "").replace(/\s*on youtube/i, "").trim();
        fallbackResponse = `Playing ${fallbackInput} on YouTube.`;
      } else if (lower.includes("youtube")) {
        fallbackType = "youtube-search";
        fallbackInput = command.replace(/search\s*/i, "").replace(/\s*on youtube/i, "").trim();
        fallbackResponse = `Searching YouTube for ${fallbackInput}.`;
      } else if (lower.includes("weather")) {
        fallbackType = "weather-show";
        fallbackResponse = "Checking the weather for you.";
      } else if (lower.includes("time")) {
        fallbackType = "get-time";
        fallbackResponse = `The current time is ${moment().format("hh:mm A")}.`;
      } else if (lower.includes("date")) {
        fallbackType = "get-date";
        fallbackResponse = `Today's date is ${moment().format("YYYY-MM-DD")}.`;
      } else if (lower.includes("calculator")) {
        fallbackType = "calculator-open";
        fallbackResponse = "Opening calculator.";
      } else if (lower.includes("blackboard")) {
        fallbackType = "open-blackboard";
        fallbackResponse = "Opening Blackboard for you!";
      }

      return res.json({
        type: fallbackType,
        userInput: fallbackInput,
        response: fallbackResponse,
      });
    }
    if (gemResult.userInput?.toLowerCase().includes("open blackboard")) {
      gemResult.type = "open-blackboard";
      gemResult.response = "Opening Blackboard for you!";
    }

    if (gemResult.type === "wikipedia-search") {
      gemResult.userInput = gemResult.userInput
        .replace(/search for\s/i, "")
        .replace(/on wikipedia/i, "")
        .trim();
    }

    const type = gemResult.type;

    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        });
      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current time is ${moment().format("hh:mm A")}`,
        });
      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Today's day is ${moment().format("dddd")}`,
        });
      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `This month is ${moment().format("MMMM")}`,
        });
      case "google-search":
      case "wikipedia-search":
      case "x-search":
      case "linkedin-search":
      case "reddit-search":
      case "spotify-open":
      case "spotify-open":
      case "maps-search":
      case "translate-search":
      case "github-search":
      case "gmail-open":

      case "youtube-search":
      case "youtube-play":
      case "general":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "open-blackboard":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:
        return res.json({
          type: "general",
          userInput: gemResult.userInput || command,
          response:
            gemResult.response || "I didn't understand that command, but I'm here to help!",
        });
    }
  } catch (error) {
    console.error("[askToAssistant Error]:", error);
    return res.json({
      type: "general",
      userInput: req.body?.command || "",
      response: "I'm having trouble thinking right now. Please try asking again!",
    });
  }
};

export const transcribeAudio = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "GROQ_API_KEY is not configured" });
    }

    const formData = new FormData();
    const uint8Array = new Uint8Array(req.file.buffer);
    const fileBlob = new Blob([uint8Array], {
      type: req.file.mimetype || "audio/webm",
    });
    formData.append("file", fileBlob, "recording.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("[Groq Whisper Error]:", errText);
      return res.status(groqResponse.status).json({
        message: "Transcription failed",
        details: errText,
      });
    }

    const result = await groqResponse.json();
    return res.status(200).json({ text: result.text || "" });
  } catch (error) {
    console.error("[Transcribe Error]:", error);
    return res.status(500).json({ message: "Transcription error", error: error.message });
  }
};
