import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/teamAuth";
import TeamsClient from "./TeamsClient";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const user = await requireAuth();

  return <TeamsClient />;
}
