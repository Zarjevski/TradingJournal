import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/teamAuth";
import { prisma } from "@/lib/prisma";
import RoomClient from "./RoomClient";

interface PageProps {
  params: Promise<{
    teamId: string;
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { teamId, roomId } = await params;

  try {
    // Enforce authentication and team membership
    await requireTeamMember(teamId);

    // Verify room exists and belongs to team
    const room = await prisma.teamRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        teamID: true,
        sharedSymbol: true,
        sharedMarket: true,
        sharedTf: true,
      },
    });

    if (!room) {
      redirect(`/team/${teamId}`);
    }

    if (room.teamID !== teamId) {
      redirect(`/team/${teamId}`);
    }

    return (
      <RoomClient
        roomId={roomId}
        teamId={teamId}
        roomName={room.name}
        sharedSymbol={room.sharedSymbol ?? undefined}
        sharedMarket={room.sharedMarket ?? undefined}
        sharedTf={room.sharedTf ?? undefined}
      />
    );
  } catch (error) {
    redirect(`/team/${teamId}`);
  }
}
