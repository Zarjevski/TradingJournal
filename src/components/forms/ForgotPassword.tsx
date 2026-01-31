"use client";

import React, { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import axios from "axios";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";
import { IoMailOutline, IoCheckmarkCircle } from "react-icons/io5";

interface ForgotPasswordProps {
  colorMode: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordProps> = ({ colorMode }) => {
  const { colorMode: chakraColorMode } = useColorMode();
  const actualColorMode = colorMode || chakraColorMode;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/forgot-password", {
        email,
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail("");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-8 md:p-12 border rounded-xl shadow-2xl backdrop-blur-sm w-full max-w-md ${
          actualColorMode === "light"
            ? "bg-white/95 border-gray-200 text-gray-900"
            : "bg-gray-800/95 border-gray-700 text-white"
        }`}
      >
        <div className="text-center">
          <IoCheckmarkCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p
            className={`text-sm mb-4 ${
              actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            We've sent a password reset link to your email address. Please
            check your inbox and follow the instructions to reset your password.
          </p>
          <p
            className={`text-xs ${
              actualColorMode === "light" ? "text-gray-500" : "text-gray-500"
            }`}
          >
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-8 md:p-12 border rounded-xl shadow-2xl backdrop-blur-sm w-full max-w-md ${
        actualColorMode === "light"
          ? "bg-white/95 border-gray-200 text-gray-900"
          : "bg-gray-800/95 border-gray-700 text-white"
      }`}
      onSubmit={handleSubmit}
    >
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div
            className={`p-3 rounded-full ${
              actualColorMode === "light"
                ? "bg-blue-100"
                : "bg-blue-900/30"
            }`}
          >
            <IoMailOutline className={`w-8 h-8 ${
              colorMode === "light" ? "text-blue-600" : "text-blue-400"
            }`} />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
        <h2
          className={`text-sm ${
            actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Enter your email address and we'll send you a link to reset your
          password
        </h2>
      </header>

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
          label="Email Address"
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          value={email}
          required
          placeholder="Enter your email"
        />
      </div>

      <Button
        text={isLoading ? "Sending..." : "Send Reset Link"}
        width="w-full"
        type="submit"
        disabled={isLoading}
        variant="primary"
      />
    </motion.form>
  );
};

export default ForgotPasswordForm;
