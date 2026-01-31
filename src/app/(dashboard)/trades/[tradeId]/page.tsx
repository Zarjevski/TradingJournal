import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";
import TradeDetailsClient from "./TradeDetailsClient";

interface PageProps {
  params: Promise<{ tradeId: string }>;
}

// Validate MongoDB ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default async function TradeDetailsPage({ params }: PageProps) {
  const { tradeId } = await params;

  if (!tradeId || !isValidObjectId(tradeId)) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  try {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
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
      notFound();
    }

    // Verify trade belongs to user
    if (trade.traderID !== currentUser.id) {
      // Show 403 page instead of redirecting
      redirect("/trades/403");
    }

    // Convert Date objects to ISO strings for client component
    const tradeData = {
      ...trade,
      date: trade.date.toISOString(),
      createdAt: trade.createdAt.toISOString(),
      comments: trade.comments.map((comment: any) => ({
        ...comment,
      })),
    };

    return <TradeDetailsClient trade={tradeData as any} />;
  } catch (error) {
    console.error("Error fetching trade:", error);
    notFound();
  }
}
