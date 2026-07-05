import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

describe("POST /api/checkout", () => {
  const originalPriceId = process.env.STRIPE_PRICE_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRICE_ID = "price_test_123";
  });

  afterEach(() => {
    process.env.STRIPE_PRICE_ID = originalPriceId;
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("returns 501 when STRIPE_PRICE_ID is not configured", async () => {
    delete process.env.STRIPE_PRICE_ID;
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1", email: "a@b.com", firstName: "A", lastName: "B" } as any);
    const response = await POST();
    expect(response.status).toBe(501);
  });

  it("creates a new Stripe customer when the user has no existing subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
    } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session1" });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session1");
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com" })
    );
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new", mode: "subscription" })
    );
  });

  it("reuses the existing Stripe customer id when a subscription record already exists", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
    } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      stripeCustomerId: "cus_existing",
    } as any);
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session2" });

    await POST();

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
  });
});
