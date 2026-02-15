import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface TradeFormData {
  symbol: string;
  position: string;
  margin: string;
  date: string;
  status: string;
  size: string;
  reason: string;
  result: string;
  exchangeName: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exchangeId, formData } = body;

    if (!exchangeId || typeof exchangeId !== "string") {
      return NextResponse.json(
        { error: "Exchange ID is required" },
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

    // Verify exchange belongs to user
    const exchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
    });

    if (!exchange || exchange.traderID !== currentUser.id) {
      return NextResponse.json(
        { error: "Exchange not found or access denied" },
        { status: 404 }
      );
    }

    const {
      symbol,
      position,
      margin,
      date,
      status,
      size,
      reason,
      result,
      exchangeName,
    } = formData as TradeFormData;

    // Validate required fields
    if (!symbol || !position || !date || !status || !size || !reason || !exchangeName) {
      const missingFields = [];
      if (!symbol) missingFields.push("symbol");
      if (!position) missingFields.push("position");
      if (!date) missingFields.push("date");
      if (!status) missingFields.push("status");
      if (!size) missingFields.push("size");
      if (!reason) missingFields.push("reason");
      if (!exchangeName) missingFields.push("exchangeName");
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const isoDate = new Date(`${date} 00:00 UTC`);
    if (isNaN(isoDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const sizeToInt = parseInt(size, 10);
    if (isNaN(sizeToInt) || sizeToInt <= 0) {
      return NextResponse.json(
        { error: "Size must be a positive number" },
        { status: 400 }
      );
    }

    // Result is optional, default to 0 if not provided or empty
    const resultToInt = result && result.trim() !== "" 
      ? parseInt(result, 10) 
      : 0;
    if (isNaN(resultToInt)) {
      return NextResponse.json(
        { error: "Result must be a valid number" },
        { status: 400 }
      );
    }

    // Margin is optional, default to empty string if not provided
    const marginValue = margin && margin.trim() !== "" ? margin.trim() : "";

    const imageURL = formData.imageURL || null;

    // Create trade and update exchange balance so P&L is reflected
    const trade = await prisma.trade.create({
      data: {
        traderID: currentUser.id,
        exchangeID: exchangeId,
        exchangeName: exchangeName.trim(),
        position: position.trim(),
        margin: marginValue,
        date: isoDate,
        status: status.trim(),
        size: sizeToInt,
        symbol: symbol.trim(),
        result: resultToInt,
        reason: reason.trim(),
        imageURL: imageURL || null,
      },
    });

    // Update the exchange balance by the trade result (profit/loss)
    // Example: starting balance 100, result 50 -> new balance 150
    if (resultToInt !== 0) {
      await prisma.exchange.update({
        where: { id: exchangeId },
        data: {
          balance: {
            increment: resultToInt,
          },
        },
      });
    }

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
