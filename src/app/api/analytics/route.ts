import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computeAnalytics } from "@/lib/analytics";

const MAX_TRADES = 10000;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("start");
    const endDateStr = searchParams.get("end");
    const exchangeId = searchParams.get("exchangeId");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");
    const symbol = searchParams.get("symbol");

    // Validate and parse dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Include full end date

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      traderID: currentUser.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Exclude PENDING by default (unless explicitly requested)
    if (!status || status === "All") {
      where.status = {
        not: "PENDING",
      };
    } else {
      where.status = status.toUpperCase();
    }

    if (exchangeId && exchangeId !== "All") {
      where.exchangeID = exchangeId;
    }

    if (direction && direction !== "All") {
      where.position = direction.toUpperCase();
    }

    if (symbol && symbol.trim()) {
      where.symbol = {
        contains: symbol.trim(),
        mode: "insensitive",
      };
    }

    // Fetch trades
    const trades = await prisma.trade.findMany({
      where,
      select: {
        id: true,
        exchangeID: true,
        exchangeName: true,
        symbol: true,
        position: true,
        margin: true,
        date: true,
        status: true,
        size: true,
        reason: true,
        result: true,
      },
      orderBy: { date: "asc" },
    });

    // Check trade limit
    if (trades.length > MAX_TRADES) {
      return NextResponse.json(
        {
          error: `Too many trades (${trades.length}). Please narrow the date range. Maximum allowed: ${MAX_TRADES}`,
        },
        { status: 400 }
      );
    }

    // Fetch user exchanges for segmentation
    const exchanges = await prisma.exchange.findMany({
      where: { traderID: currentUser.id },
      select: {
        id: true,
        exchangeName: true,
      },
    });

    // Compute analytics
    try {
      const analytics = computeAnalytics(trades, exchanges);
      return NextResponse.json(analytics);
    } catch (computeError: any) {
      console.error("Error computing analytics:", computeError);
      return NextResponse.json(
        { error: `Analytics computation failed: ${computeError.message || "Unknown error"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
