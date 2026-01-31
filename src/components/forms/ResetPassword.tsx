"use client";

import React, { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import axios from "axios";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";
import { useRouter } from "next/navigation";
import { IoLockClosedOutline, IoCheckmarkCircle } from "react-icons/io5";

interface ResetPasswordProps {
  token: string;
  colorMode: string;
}

const ResetPasswordForm: React.FC<ResetPasswordProps> = ({
  token,
  colorMode,
}) => {
  const { colorMode: chakraColorMode } = useColorMode();
  const actualColorMode = colorMode || chakraColorMode;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/reset-password", {
        token,
        password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Failed to reset password. The link may have expired. Please request a new one."
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
          <h2 className="text-2xl font-bold mb-2">Password Reset Successful</h2>
          <p
            className={`text-sm mb-4 ${
              actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            Your password has been successfully reset. You will be redirected to
            the login page shortly.
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
            <IoLockClosedOutline className={`w-8 h-8 ${
              colorMode === "light" ? "text-blue-600" : "text-blue-400"
            }`} />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
        <h2
          className={`text-sm ${
            actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Enter your new password below
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
          type="password"
          name="password"
          label="New Password"
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          value={password}
          required
          placeholder="At least 8 characters"
        />
        <Input
          type="password"
          name="confirmPassword"
          label="Confirm New Password"
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          value={confirmPassword}
          required
          placeholder="Re-enter your password"
        />
      </div>

      <Button
        text={isLoading ? "Resetting..." : "Reset Password"}
        width="w-full"
        type="submit"
        disabled={isLoading}
        variant="primary"
      />
    </motion.form>
  );
};

export default ResetPasswordForm;
