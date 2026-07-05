"use client";

import React, { useState } from "react";
import axios from "axios";
import { FaGoogle } from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/common/Skeleton";
import showNotification from "@/hooks/useShowNotification";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/validation";

const Page = () => {
  const { colorMode } = useColorMode();
  const { user, isLoading, refetch } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const mutedText = colorMode === "light" ? "text-gray-600" : "text-gray-400";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    if (!isStrongPassword(form.newPassword)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.patch("/api/user/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showNotification("Password updated successfully", "Success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      await refetch();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-3 md:p-6 overflow-y-auto app-bg">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl xs:text-3xl font-bold mb-1 md:mb-2">Security</h1>
        <p className={`text-xs xs:text-sm ${mutedText}`}>
          Manage how you sign in to your account
        </p>
      </div>

      {isLoading ? (
        <Skeleton width="w-full" hieght="h-40" />
      ) : user?.hasPassword === false ? (
        <div
          className={`max-w-xl rounded-lg border p-4 flex items-start gap-3 ${
            colorMode === "light"
              ? "bg-zinc-50 border-gray-200"
              : "bg-zinc-800/50 border-zinc-700"
          }`}
        >
          <FaGoogle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">You sign in with Google</p>
            <p className={`text-sm mt-1 ${mutedText}`}>
              This account doesn&apos;t have a password. Manage your sign-in
              through your Google account settings instead.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {error && (
            <Alert variant="error" title="Error">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <Input
            type="password"
            label="Current Password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
          <Input
            type="password"
            label="New Password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="At least 10 characters, with a letter and a number"
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            label="Confirm New Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
          />

          <div className="flex justify-end pt-2 border-t">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Page;
