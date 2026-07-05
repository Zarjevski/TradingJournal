import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import NewsClient from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return <NewsClient />;
}
