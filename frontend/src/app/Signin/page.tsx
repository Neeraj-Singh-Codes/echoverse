// components/SignupForm.jsx
"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import Link from "next/link";
import Spline from "@splinetool/react-spline";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const SigninForm = () => {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your signup logic here (e.g., API call)
    try {
      let response = await axios.post(
        "http://localhost:8000/api/auth/signIn",
        formData,
        { withCredentials: true }
      );
      if (response.status === 200 || 201) {
        router.push("/Mainpage");
      }
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Server error. Please try again later."
      );
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: any) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-black">
      <Toaster />
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
      <div className="w-full max-w-5xl rounded-2xl bg-gray-800/60 p-8 shadow-2xl backdrop-blur-md md:flex">
        {/* Left Section: Form */}

        {/* Right Section: Visual */}

        <div className="relative hidden w-1/2 overflow-hidden rounded-r-2xl bg-gray-900 md:block">
          <Spline
            scene="https://prod.spline.design/9Irp8XlR1TCvdwhE/scene.splinecode"
            className="rounded-2xl bg-gray-700"
            onLoad={() => {
              console.log("Spline loaded");
              setIsLoading(false);
            }}
          />

          {isLoading && (
            <span className="loading loading-infinity loading-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></span>
          )}
        </div>

        <div className="flex flex-col justify-center p-8 md:w-1/2">
          <h1 className="mb-8 text-3xl font-bold text-white">
            Log In for Echoverse
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Your Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full mt-1 rounded-md border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="flex justify-between w-full border rounded-md border-gray-600 bg-gray-700/50 placeholder-gray-400 p-3 text-white  focus-within:ring-2 focus-within:ring-purple-500">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className=" w-full focus:outline-none"
                />
                {showPassword ? (
                  <button type="button" onClick={() => setShowPassword(false)}>
                    <EyeOff />
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowPassword(true)}>
                    <Eye />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-gradient-to-r from-purple-600 to-blue-500 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg mt-1"
            >
              Welcome Back!
            </button>
          </form>
          <Link href="/Signup">
            <div className="mt-4 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <span className="font-semibold text-purple-400 hover:text-purple-300">
                Sign up
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SigninForm;
