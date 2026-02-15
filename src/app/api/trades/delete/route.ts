import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id: tradeId } = body;

    if (!tradeId || typeof tradeId !== "string") {
      return NextResponse.json(
        { error: "Trade ID is required" },
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
      where: { id: tradeId },
    });

    if (!trade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    if (trade.traderID !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Reverse P&L on the exchange before deleting (so balance is correct)
    if (trade.result !== 0) {
      await prisma.exchange.update({
        where: { id: trade.exchangeID },
        data: {
          balance: {
            increment: -trade.result,
          },
        },
      });
    }

    await prisma.trade.delete({
      where: { id: tradeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
