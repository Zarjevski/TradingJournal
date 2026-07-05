import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe moved `current_period_end` off the top-level Subscription object and onto each
// line item (subscriptions can have multiple items with independent billing periods as of
// this API version) — we only ever create single-item subscriptions, so just read the first.
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | undefined {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : undefined;
}

// Maps Stripe's subscription status values onto this app's own status strings.
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "paused":
    default:
      return "INCOMPLETE";
  }
}

// POST /api/webhooks/stripe — receives Stripe subscription lifecycle events and keeps the
// local Subscription record in sync. Needs the *raw* request body (not JSON-parsed) to
// verify the signature, which is why this reads request.text() instead of request.json().
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhooks are not configured yet" },
      { status: 501 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !customerId) {
          console.error("checkout.session.completed missing userId or customerId", {
            userId,
            customerId,
          });
          break;
        }

        let currentPeriodEnd: Date | undefined;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          currentPeriodEnd = getCurrentPeriodEnd(subscription);
        }

        await prisma.subscription.upsert({
          where: { userID: userId },
          create: {
            userID: userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "ACTIVE",
            currentPeriodEnd,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "ACTIVE",
            currentPeriodEnd,
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const existing = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (!existing) {
          console.error("Received subscription update for unknown customer:", customerId);
          break;
        }

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscription.id,
            status:
              event.type === "customer.subscription.deleted"
                ? "CANCELED"
                : mapStripeStatus(subscription.status),
            currentPeriodEnd: getCurrentPeriodEnd(subscription),
          },
        });
        break;
      }

      default:
        // Ignore events we don't act on.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
