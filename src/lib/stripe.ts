import Stripe from "stripe";

// Reads STRIPE_SECRET_KEY lazily (not at module load) so the rest of the app doesn't crash
// on import in environments where Stripe hasn't been configured yet (e.g. local dev before
// a Stripe account is set up) — only routes that actually use Stripe will throw.
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}
