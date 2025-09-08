import express from "express";
import { login, logout, signUp } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signUp", signUp);
authRouter.post("/signIn", login);
authRouter.get("/logout", logout);
export default authRouter;
