"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useColorMode } from "@/context/ColorModeContext";
import ForgotPasswordForm from "@/components/forms/ForgotPassword";
import Logo from "@/components/common/Logo";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by using default colorMode until mounted
  const displayColorMode = mounted ? colorMode : "dark";

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <Logo width={300} height={200} colorMode={displayColorMode} />
      <ForgotPasswordForm colorMode={displayColorMode} />
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

export default ForgotPasswordPage;
