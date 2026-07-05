import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/teamAuth";
import NewTeamClient from "./NewTeamClient";

export const dynamic = "force-dynamic";

export default async function NewTeamPage() {
  await requireAuth();
  return <NewTeamClient />;
}
