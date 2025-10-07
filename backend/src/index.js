import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoute.js";
import geminiResponse from "./gemini.js";

dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(
  cors({
    origin: ["https://echoverse-dxh5.onrender.com","http://localhost:3000"],
    credentials: true, // very important
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

connectDB().then(() => {
  app.listen(port || 5001, () => {
    console.log(`Server running on ${port}`);
  });
});
