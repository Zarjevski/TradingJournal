import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exchange, image, balance } = body;

    if (!exchange || typeof exchange !== "string" || exchange.trim().length === 0) {
      return NextResponse.json(
        { error: "Exchange name is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Exchange image is required" },
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

    const newExchange = await prisma.exchange.create({
      data: {
        traderID: currentUser.id,
        exchangeName: exchange.trim(),
        balance: balance ? parseInt(balance) : 0,
        image,
      },
    });

    return NextResponse.json(newExchange, { status: 201 });
  } catch (error) {
    console.error("Error creating exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
