"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useColorMode } from "@/context/ColorModeContext";
import Logo from "@/components/common/Logo";
import ResetPasswordForm from "@/components/forms/ResetPassword";
import Link from "next/link";

function ResetPasswordContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();
  const { colorMode } = useColorMode();
  const token = searchParams.get("token");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/");
    }
  }, [session?.status, router]);

  const displayColorMode = mounted ? colorMode : "dark";

  if (!token) {
    return (
      <section className="w-full min-h-screen flex flex-col items-center justify-center p-4 app-bg">
        <Link
          href="/auth/login"
          className={`absolute top-4 left-4 text-sm font-medium hover:underline ${
            displayColorMode === "light" ? "text-blue-600" : "text-purple-400"
          }`}
        >
          ← Back to login
        </Link>
        <Logo width={280} height={140} colorMode={displayColorMode} />
        <div className={`mt-8 p-8 max-w-md w-full border rounded-xl shadow-2xl text-center ${
          displayColorMode === "light"
            ? "bg-white/95 border-gray-200 text-gray-900"
            : "bg-gray-800/95 border-gray-700 text-white"
        }`}>
          <h1 className="text-xl font-bold mb-2">Invalid or missing reset link</h1>
          <p className={`text-sm mb-6 ${displayColorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            This password reset link is invalid or has expired. Please request a new one from the forgot password page.
          </p>
          <Link
            href="/forgot-password"
            className={`inline-block font-medium ${displayColorMode === "light" ? "text-blue-600 hover:text-blue-700" : "text-purple-400 hover:text-purple-300"}`}
          >
            Request new reset link →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center p-4 app-bg">
      <Link
        href="/auth/login"
        className={`absolute top-4 left-4 text-sm font-medium hover:underline ${
          displayColorMode === "light" ? "text-blue-600" : "text-purple-400"
        }`}
      >
        ← Back to login
      </Link>
      <Logo width={280} height={140} colorMode={displayColorMode} />
      <ResetPasswordForm token={token} colorMode={displayColorMode} />
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <section className="w-full min-h-screen flex flex-col items-center justify-center app-bg">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </section>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
