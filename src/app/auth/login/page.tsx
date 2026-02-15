"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useColorMode } from "@/context/ColorModeContext";
import Login from "@/components/forms/Login";
import Logo from "@/components/common/Logo";
import Register from "@/components/forms/Register";

type variant = "login" | "register";

const Page = () => {
  const [variant, setVariant] = useState<string>("login");
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

  // Prevent hydration mismatch by using default colorMode until mounted
  const displayColorMode = mounted ? colorMode : "dark";

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center">
      <Logo width={300} height={200} colorMode={displayColorMode} />
      {variant === "login" ? (
        <Login changeVariant={setVariant} colorMode={displayColorMode} />
      ) : (
        <Register changeVariant={setVariant} colorMode={displayColorMode} />
      )}
    </section>
  );
};

export default Page;
