import express from "express";
import multer from "multer";
import {
  askToAssistant,
  fetchModel,
  getCurrentUser,
  updateAssistant,
  transcribeAudio,
} from "../controllers/userController.js";
import isAuth from "../middlewares/isAuth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const userRouter = express.Router();
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/assistant1", isAuth, fetchModel);
userRouter.put("/assistant", isAuth, updateAssistant);
userRouter.post("/asktoassistant", isAuth, askToAssistant);
userRouter.post("/askToAssistant", isAuth, askToAssistant);
userRouter.post("/transcribe", isAuth, upload.single("audio"), transcribeAudio);

export default userRouter;
