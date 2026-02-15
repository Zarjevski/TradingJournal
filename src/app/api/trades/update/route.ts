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

    let newResult: number = trade.result;
    if (updateData.result !== undefined) {
      const resultToInt = parseInt(String(updateData.result), 10);
      if (isNaN(resultToInt)) {
        return NextResponse.json(
          { error: "Result must be a number" },
          { status: 400 }
        );
      }
      dataToUpdate.result = resultToInt;
      newResult = resultToInt;
    }

    let newExchangeId: string = trade.exchangeID;
    if (updateData.exchangeID) {
      const targetExchangeId = String(updateData.exchangeID);
      // Verify exchange belongs to user
      const exchange = await prisma.exchange.findUnique({
        where: { id: targetExchangeId },
      });

      if (!exchange || exchange.traderID !== currentUser.id) {
        return NextResponse.json(
          { error: "Exchange not found or access denied" },
          { status: 404 }
        );
      }
      dataToUpdate.exchangeID = targetExchangeId;
      newExchangeId = targetExchangeId;
    }

    // Adjust exchange balances to reflect updated P&L
    // - If same exchange: increment by (newResult - oldResult)
    // - If exchange changed: remove oldResult from old exchange, add newResult to new exchange
    if (newExchangeId === trade.exchangeID) {
      const delta = newResult - trade.result;
      if (delta !== 0) {
        await prisma.exchange.update({
          where: { id: trade.exchangeID },
          data: {
            balance: {
              increment: delta,
            },
          },
        });
      }
    } else {
      // Move P&L from old exchange to new exchange
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
      if (newResult !== 0) {
        await prisma.exchange.update({
          where: { id: newExchangeId },
          data: {
            balance: {
              increment: newResult,
            },
          },
        });
      }
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
