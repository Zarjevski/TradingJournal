"use client";

import React, { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import axios from "axios";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";
import { useRouter } from "next/navigation";
import { IoLockClosedOutline, IoCheckmarkCircle } from "react-icons/io5";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/validation";

interface ResetPasswordProps {
  token: string;
  colorMode?: string;
}

const ResetPasswordForm: React.FC<ResetPasswordProps> = ({
  token,
  colorMode: colorModeProp,
}) => {
  const { colorMode: contextColorMode } = useColorMode();
  const actualColorMode = colorModeProp ?? contextColorMode;
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

    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
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
            : "bg-zinc-900/95 border-zinc-700 text-white"
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
          <Link
            href="/auth/login"
            className={`inline-block mt-4 text-sm font-medium ${
              actualColorMode === "light" ? "text-zinc-600 hover:text-zinc-700" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Go to login now →
          </Link>
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
          : "bg-zinc-900/95 border-zinc-700 text-white"
      }`}
      onSubmit={handleSubmit}
    >
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div
            className={`p-3 rounded-full ${
              actualColorMode === "light"
                ? "bg-zinc-100"
                : "bg-zinc-700/40"
            }`}
          >
            <IoLockClosedOutline className={`w-8 h-8 ${
              actualColorMode === "light" ? "text-zinc-600" : "text-zinc-400"
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
          label={<>New Password<span className="text-red-500 ml-1">*</span></>}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          value={password}
          required
          placeholder="At least 10 characters, with a letter and a number"
        />
        <Input
          type="password"
          name="confirmPassword"
          label={<>Confirm New Password<span className="text-red-500 ml-1">*</span></>}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          value={confirmPassword}
          required
          placeholder="Re-enter your password"
        />
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
          variant="primary"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </div>
    </motion.form>
  );
};

export default ResetPasswordForm;
