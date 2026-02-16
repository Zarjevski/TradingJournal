"use client";

import React, { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";

interface LoginProps {
  changeVariant: (variant: "login" | "register") => void;
  colorMode?: string;
}

const Login: React.FC<LoginProps> = ({ changeVariant, colorMode: colorModeProp }) => {
  const { colorMode: contextColorMode } = useColorMode();
  const actualColorMode = colorModeProp ?? contextColorMode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid email or password");
      } else if (response?.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 sm:p-6 md:p-12 mt-4 sm:mt-6 md:mt-8 border rounded-xl shadow-2xl backdrop-blur-sm w-full max-w-md mx-auto ${
        actualColorMode === "light"
          ? "bg-white/95 border-gray-200 text-gray-900"
          : "bg-gray-800/95 border-gray-700 text-white"
      }`}
      onSubmit={handleSubmit}
    >
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl capitalize font-bold mb-2">
          Welcome Trader!
        </h1>
        <h2
          className={`text-xs sm:text-sm ${
            actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Please login or create a new account
        </h2>
      </div>

      {error && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            actualColorMode === "light"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-red-900/30 text-red-400 border border-red-800"
          }`}
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email"
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          value={email}
          required
        />
        <Input
          type="password"
          name="password"
          label="Password"
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          value={password}
          required
        />
      </div>

      <div className="mt-6">
        <Button
          text={isLoading ? "Signing In..." : "Sign In"}
          width="w-full"
          type="submit"
          disabled={isLoading}
          variant="primary"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 mt-6 text-sm">
        <button
          type="button"
          className={`capitalize transition-colors text-left py-1 min-h-[44px] sm:min-h-0 flex items-center ${
            actualColorMode === "light"
              ? "text-blue-600 hover:text-blue-700 active:text-blue-800"
              : "text-purple-400 hover:text-purple-300 active:text-purple-200"
          }`}
          onClick={() => changeVariant("register")}
        >
          Create account
        </button>
        <Link
          href="/forgot-password"
          className={`transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center ${
            actualColorMode === "light"
              ? "text-gray-600 hover:text-gray-700"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Forgot password?
        </Link>
      </div>
    </motion.form>
  );
};

export default Login;
