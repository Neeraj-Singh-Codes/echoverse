import express from "express";
import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
} from "../controllers/userController.js";
import isAuth from "../middlewares/isAuth.js";
const userRouter = express.Router();
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.put("/assistant", isAuth, updateAssistant);
userRouter.post("/asktoassistant", isAuth, askToAssistant);

export default userRouter;
