"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useColorMode } from "@/context/ColorModeContext";
import Login from "@/components/forms/Login";
import Logo from "@/components/common/Logo";
import Register from "@/components/forms/Register";

type variant = "login" | "register";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "An account already exists with this email. Please sign in with your password instead.",
};

const LoginPageContent = () => {
  const [variant, setVariant] = useState<string>("login");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const { colorMode } = useColorMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/dashboard");
    }
  }, [session?.status, router]);

  // Prevent hydration mismatch by using default colorMode until mounted
  const displayColorMode = mounted ? colorMode : "dark";
  const authError = searchParams.get("error");
  const authErrorMessage = authError ? AUTH_ERROR_MESSAGES[authError] ?? "Something went wrong signing you in. Please try again." : null;

  return (
    <section className="w-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center">
        <Link href="/" className="w-full max-w-[180px] sm:max-w-[240px] md:max-w-[300px] mb-6">
          <Logo width={300} height={200} colorMode={displayColorMode} className="w-full h-auto" />
        </Link>
        {authErrorMessage && (
          <div
            className={`w-full mb-4 p-3 rounded-lg text-sm font-medium ${
              displayColorMode === "light"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-red-900/30 text-red-400 border border-red-800"
            }`}
          >
            {authErrorMessage}
          </div>
        )}
        {variant === "login" ? (
          <Login changeVariant={setVariant} colorMode={displayColorMode} />
        ) : (
          <Register changeVariant={setVariant} colorMode={displayColorMode} />
        )}
      </div>
    </section>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <LoginPageContent />
  </Suspense>
);

export default Page;
