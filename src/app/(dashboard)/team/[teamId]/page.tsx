import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/teamAuth";
import TeamHubClient from "./TeamHubClient";

export const dynamic = "force-dynamic";

export default async function TeamHubPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  
  try {
    await requireTeamMember(teamId);
    return <TeamHubClient teamId={teamId} />;
  } catch (error: any) {
    if (error.message === "Not a team member") {
      redirect("/team");
    }
    throw error;
  }
}
