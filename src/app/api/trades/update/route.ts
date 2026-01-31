import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id: tradeId, ...updateData } = body;

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

    // Prepare update data
    const dataToUpdate: Record<string, unknown> = {};

    if (updateData.symbol) dataToUpdate.symbol = String(updateData.symbol).trim();
    if (updateData.position) dataToUpdate.position = String(updateData.position).trim();
    if (updateData.margin) dataToUpdate.margin = String(updateData.margin).trim();
    if (updateData.status) dataToUpdate.status = String(updateData.status).trim();
    if (updateData.reason) dataToUpdate.reason = String(updateData.reason).trim();
    if (updateData.exchangeName) dataToUpdate.exchangeName = String(updateData.exchangeName).trim();
    
    if (updateData.date) {
      const isoDate = new Date(`${updateData.date} 00:00 UTC`);
      if (isNaN(isoDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      dataToUpdate.date = isoDate;
    }

    if (updateData.size !== undefined) {
      const sizeToInt = parseInt(String(updateData.size), 10);
      if (isNaN(sizeToInt) || sizeToInt <= 0) {
        return NextResponse.json(
          { error: "Size must be a positive number" },
          { status: 400 }
        );
      }
      dataToUpdate.size = sizeToInt;
    }

    if (updateData.result !== undefined) {
      const resultToInt = parseInt(String(updateData.result), 10);
      if (isNaN(resultToInt)) {
        return NextResponse.json(
          { error: "Result must be a number" },
          { status: 400 }
        );
      }
      dataToUpdate.result = resultToInt;
    }

    if (updateData.exchangeID) {
      // Verify exchange belongs to user
      const exchange = await prisma.exchange.findUnique({
        where: { id: updateData.exchangeID },
      });

      if (!exchange || exchange.traderID !== currentUser.id) {
        return NextResponse.json(
          { error: "Exchange not found or access denied" },
          { status: 404 }
        );
      }
      dataToUpdate.exchangeID = updateData.exchangeID;
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: dataToUpdate,
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
