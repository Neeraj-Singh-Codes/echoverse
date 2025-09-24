import express from "express";
import {
  askToAssistant,
  fetchModel,
  getCurrentUser,
  updateAssistant,
} from "../controllers/userController.js";
import isAuth from "../middlewares/isAuth.js";
const userRouter = express.Router();
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/assistant1", isAuth, fetchModel);
userRouter.put("/assistant", isAuth, updateAssistant);
userRouter.post("/asktoassistant", isAuth, askToAssistant);

export default userRouter;
