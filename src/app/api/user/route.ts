import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { firstName, lastName, id, photoURL, status } = currentUser;

    const [trades, rules, exchanges] = await Promise.all([
      prisma.trade.findMany({
        where: { traderID: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rule.findMany({
        where: { traderID: id },
      }),
      prisma.exchange.findMany({
        where: { traderID: id },
      }),
    ]);

    return NextResponse.json({
      firstName,
      lastName,
      id,
      photoURL,
      status: status || "NEUTRAL",
      trades,
      rules,
      exchanges,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
