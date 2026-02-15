import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/** Normalize email for comparison (trim + lowercase). */
function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** GET /api/team-invites/mine - Pending team invites for the current user (by email or invitedUserID). */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string } | null)?.id;
    const sessionEmail = (session?.user as { email?: string } | null)?.email;
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get("debug") === "1";

    const user = sessionUserId
      ? await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true, email: true } })
      : sessionEmail
        ? await prisma.user.findUnique({ where: { email: sessionEmail }, select: { id: true, email: true } })
        : null;

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedUserEmail = normalizeEmail(user.email);

    // Fetch all pending (non-accepted, not expired) invites.
    const allPending = await prisma.teamInvite.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Match by invitedUserID (when set) or by normalized email. invitedUserID may be undefined if DB not migrated.
    const invites = allPending.filter((inv) => {
      const invAny = inv as { invitedUserID?: string | null };
      const byId = invAny.invitedUserID != null && invAny.invitedUserID === user.id;
      const byEmail = normalizeEmail(inv.email) === normalizedUserEmail;
      return byId || byEmail;
    });

    if (debug) {
      return NextResponse.json({
        invites,
        _debug: {
          sessionHasId: !!sessionUserId,
          sessionHasEmail: !!sessionEmail,
          userId: user.id,
          userEmailMasked: user.email ? `${user.email.slice(0, 2)}***@${user.email.split("@")[1] || "?"}` : null,
          normalizedEmail: normalizedUserEmail,
          totalPending: allPending.length,
          matchedCount: invites.length,
          pendingInviteEmails: allPending.map((i) => normalizeEmail(i.email)),
        },
      });
    }

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching my invites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
