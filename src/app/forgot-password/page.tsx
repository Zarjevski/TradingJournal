"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useColorMode } from "@/context/ColorModeContext";
import Logo from "@/components/common/Logo";
import ForgotPasswordForm from "@/components/forms/ForgotPassword";
import Link from "next/link";

const Page = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const session = useSession();
  const { colorMode } = useColorMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/");
    }
  }, [session?.status, router]);

  const displayColorMode = mounted ? colorMode : "dark";

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center p-4 app-bg relative">
      <Link
        href="/auth/login"
        className={`absolute top-4 left-4 text-sm font-medium hover:underline ${
          displayColorMode === "light" ? "text-blue-600" : "text-purple-400"
        }`}
      >
        ← Back to login
      </Link>
      <Logo width={280} height={140} colorMode={displayColorMode} />
      <ForgotPasswordForm colorMode={displayColorMode} />
    </section>
  );
};

export default Page;
