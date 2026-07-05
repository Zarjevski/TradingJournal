import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import AccountsClient from "./AccountsClient";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return <AccountsClient />;
}
