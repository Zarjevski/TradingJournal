import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import CommunityClient from "./CommunityClient";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return <CommunityClient />;
}
