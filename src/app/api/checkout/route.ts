import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

// POST /api/checkout — starts a Stripe Checkout session for the single "Pro" subscription
// tier. Reuses an existing Stripe customer if this user already has one (e.g. a past
// canceled subscription) instead of creating a duplicate.
export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Subscriptions are not configured yet" },
        { status: 501 }
      );
    }

    const stripe = getStripeClient();

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userID: currentUser.id },
    });

    const customerId =
      existingSubscription?.stripeCustomerId ??
      (
        await stripe.customers.create({
          email: currentUser.email,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          metadata: { userId: currentUser.id },
        })
      ).id;

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/learn?checkout=success`,
      cancel_url: `${baseUrl}/learn?checkout=canceled`,
      metadata: { userId: currentUser.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
