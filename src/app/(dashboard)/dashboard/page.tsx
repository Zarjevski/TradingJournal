import { redirect } from "next/navigation";
import { getHomeData } from "@/lib/home";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const homeData = await getHomeData();

  if (!homeData) {
    redirect("/auth/login");
  }

  return <HomeClient homeData={homeData} />;
}
