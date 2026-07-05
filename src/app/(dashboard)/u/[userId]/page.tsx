import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "@/lib/friends";
import { getRelationship, getProfileData } from "@/lib/profile";
import Link from "next/link";
import FriendProfileClient from "./FriendProfileClient";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 app-bg">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to view profiles.</p>
          <Link
            href="/auth/login"
            className="text-zinc-900 dark:text-zinc-100 underline mt-2 inline-block"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) notFound();

  const { userId } = await params;
  if (!userId || !isValidObjectId(userId)) notFound();

  const profileUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      bio: true,
      status: true,
    },
  });
  if (!profileUser) notFound();

  const relationship = await getRelationship(me.id, profileUser.id);

  if (relationship === "BLOCKED") {
    return (
      <div className="min-h-full flex items-center justify-center p-6 app-bg">
        <div className="rounded-xl border border-gray-700 bg-slate-900/50 shadow p-8 max-w-md text-center">
          <p className="font-medium text-gray-200">You cannot view this profile.</p>
          <p className="text-sm text-gray-400 mt-1">
            This user is blocked or has blocked you.
          </p>
          <Link
            href="/community"
            className="text-zinc-400 hover:underline mt-4 inline-block"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const { privacy, stats, activity, tradingDNA, mutualTeams } = await getProfileData(
    profileUser.id,
    me.id,
    relationship
  );

  return (
    <FriendProfileClient
      profileUser={{
        id: profileUser.id,
        firstName: profileUser.firstName,
        lastName: profileUser.lastName,
        photoURL: profileUser.photoURL,
        bio: profileUser.bio,
        status: profileUser.status,
      }}
      relationship={relationship}
      stats={stats}
      activity={activity}
      tradingDNA={tradingDNA}
      mutualTeams={mutualTeams}
      privacy={{
        shareTradeCount: privacy.shareTradeCount,
        shareWinRate: privacy.shareWinRate,
        shareTopSymbols: privacy.shareTopSymbols,
        shareActivity: privacy.shareActivity,
      }}
    />
  );
}
