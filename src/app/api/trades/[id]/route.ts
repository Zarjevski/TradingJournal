import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

// Validate MongoDB ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// GET - Fetch a single trade with comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid trade ID" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        exchange: {
          select: {
            id: true,
            exchangeName: true,
            image: true,
            balance: true,
          },
        },
        trader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoURL: true,
            email: true,
          },
        },
        comments: {
          take: 50,
          orderBy: { id: "desc" },
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoURL: true,
              },
            },
          },
        },
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    // Verify trade belongs to user
    if (trade.traderID !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error("Error fetching trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a trade
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid trade ID" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify trade exists and belongs to user
    const existingTrade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    if (existingTrade.traderID !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dataToUpdate: Record<string, unknown> = {};

    // Validate and update symbol
    if (body.symbol !== undefined) {
      const symbol = String(body.symbol).trim();
      if (symbol.length === 0 || symbol.length > 30) {
        return NextResponse.json(
          { error: "Symbol must be between 1 and 30 characters" },
          { status: 400 }
        );
      }
      dataToUpdate.symbol = symbol;
    }

    // Validate and update position
    if (body.position !== undefined) {
      const position = String(body.position).trim().toUpperCase();
      if (!["LONG", "SHORT"].includes(position)) {
        return NextResponse.json(
          { error: "Position must be LONG or SHORT" },
          { status: 400 }
        );
      }
      dataToUpdate.position = position;
    }

    // Validate and update margin
    if (body.margin !== undefined) {
      const margin = String(body.margin).trim().toUpperCase();
      if (!["ISOLATED", "CROSSED"].includes(margin)) {
        return NextResponse.json(
          { error: "Margin must be ISOLATED or CROSSED" },
          { status: 400 }
        );
      }
      dataToUpdate.margin = margin;
    }

    // Validate and update status
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      const allowedStatuses = ["PENDING", "WIN", "LOSS", "BREAK_EVEN", "CANCELED"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${allowedStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      dataToUpdate.status = status;
    }

    // Validate and update date
    if (body.date !== undefined) {
      const date = new Date(body.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      dataToUpdate.date = date;
    }

    // Validate and update size
    if (body.size !== undefined) {
      const size = parseInt(String(body.size), 10);
      if (isNaN(size) || size < 0) {
        return NextResponse.json(
          { error: "Size must be a non-negative integer" },
          { status: 400 }
        );
      }
      dataToUpdate.size = size;
    }

    // Validate and update result
    if (body.result !== undefined) {
      const result = parseInt(String(body.result), 10);
      if (isNaN(result)) {
        return NextResponse.json(
          { error: "Result must be a valid number" },
          { status: 400 }
        );
      }
      dataToUpdate.result = result;
    }

    // Validate and update reason
    if (body.reason !== undefined) {
      const reason = String(body.reason).trim();
      if (reason.length < 2) {
        return NextResponse.json(
          { error: "Reason must be at least 2 characters" },
          { status: 400 }
        );
      }
      dataToUpdate.reason = reason;
    }

    // Validate and update imageURL
    if (body.imageURL !== undefined) {
      const imageURL = body.imageURL === null || body.imageURL === "" ? null : String(body.imageURL).trim();
      if (imageURL !== null) {
        // Basic URL validation
        try {
          new URL(imageURL);
        } catch {
          // If it's not a full URL, check if it's a relative path
          if (!imageURL.startsWith("/")) {
            return NextResponse.json(
              { error: "imageURL must be a valid URL or relative path starting with /" },
              { status: 400 }
            );
          }
        }
      }
      dataToUpdate.imageURL = imageURL;
    }

    // Cross-field validation: status WIN or LOSS => result must not be 0
    const finalStatus = (dataToUpdate.status as string) || existingTrade.status;
    const finalResult = dataToUpdate.result !== undefined ? (dataToUpdate.result as number) : existingTrade.result;
    
    if ((finalStatus === "WIN" || finalStatus === "LOSS") && finalResult === 0) {
      return NextResponse.json(
        { error: "Result cannot be 0 when status is WIN or LOSS" },
        { status: 400 }
      );
    }

    // Cross-field validation: status BREAK_EVEN => result must be 0
    if (finalStatus === "BREAK_EVEN" && finalResult !== 0) {
      return NextResponse.json(
        { error: "Result must be 0 when status is BREAK_EVEN" },
        { status: 400 }
      );
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: dataToUpdate,
      include: {
        exchange: {
          select: {
            id: true,
            exchangeName: true,
            image: true,
            balance: true,
          },
        },
        trader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoURL: true,
            email: true,
          },
        },
        comments: {
          take: 50,
          orderBy: { id: "desc" },
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoURL: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
