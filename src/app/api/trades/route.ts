import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));
    const status = searchParams.get("status");
    const exchangeId = searchParams.get("exchangeId");
    const symbol = searchParams.get("symbol");
    const position = searchParams.get("position");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Validate page
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }

    // Validate pageSize
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: "Invalid page size (must be between 1 and 50)" },
        { status: 400 }
      );
    }

    // Validate exchangeId if provided
    if (exchangeId && exchangeId !== "All" && !isValidObjectId(exchangeId)) {
      return NextResponse.json(
        { error: "Invalid exchange ID" },
        { status: 400 }
      );
    }

    // Validate sortBy
    const validSortFields = ["date", "result"];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sort field" },
        { status: 400 }
      );
    }

    // Validate sortDir
    const validSortDirs = ["asc", "desc"];
    if (!validSortDirs.includes(sortDir)) {
      return NextResponse.json(
        { error: "Invalid sort direction" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      traderID: currentUser.id, // Always enforce ownership
    };

    // Status filter
    if (status && status !== "All") {
      where.status = status.toUpperCase();
    }

    // Exchange filter
    if (exchangeId && exchangeId !== "All") {
      where.exchangeID = exchangeId;
    }

    // Position filter
    if (position && position !== "All") {
      where.position = position.toUpperCase();
    }

    // Symbol search (case-insensitive)
    if (symbol && symbol.trim()) {
      where.symbol = {
        contains: symbol.trim(),
        mode: "insensitive",
      };
    }

    // Date range filter
    if (from || to) {
      where.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid 'from' date format" },
            { status: 400 }
          );
        }
        fromDate.setUTCHours(0, 0, 0, 0);
        where.date.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid 'to' date format" },
            { status: 400 }
          );
        }
        toDate.setUTCHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortDir;

    // Get total count for pagination
    const total = await prisma.trade.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch trades
    const trades = await prisma.trade.findMany({
      where,
      select: {
        id: true,
        date: true,
        symbol: true,
        exchangeName: true,
        position: true,
        status: true,
        size: true,
        result: true,
      },
      orderBy,
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      items: trades,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
