"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColorMode } from "@/context/ColorModeContext";
import ResetPasswordForm from "@/components/forms/ResetPassword";
import Logo from "@/components/common/Logo";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colorMode } = useColorMode();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const tokenParam = searchParams.get("token");
      if (!tokenParam) {
        router.push("/auth/forgot-password");
      } else {
        setToken(tokenParam);
      }
    }
  }, [searchParams, router, mounted]);

  // Prevent hydration mismatch by using default colorMode until mounted
  const displayColorMode = mounted ? colorMode : "dark";

  if (!mounted || !token) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className={displayColorMode === "light" ? "text-gray-600" : "text-gray-400"}>Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <Logo width={300} height={200} colorMode={displayColorMode} />
      <ResetPasswordForm token={token} colorMode={displayColorMode} />
      <button
        onClick={() => router.push("/auth/login")}
        className={`mt-4 text-sm transition-colors ${
          displayColorMode === "light"
            ? "text-blue-600 hover:text-blue-700"
            : "text-blue-400 hover:text-blue-300"
        }`}
      >
        Back to Login
      </button>
    </section>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <section className="w-full min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className={displayColorMode === "light" ? "text-gray-600" : "text-gray-400"}>Loading...</p>
          </div>
        </section>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
