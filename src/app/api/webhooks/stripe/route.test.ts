import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";

function makeRequest(body: string, signature = "test-signature") {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 501 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(501);
  });

  it("returns 400 when the stripe-signature header is missing", async () => {
    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(400);
  });

  it("creates a subscription on checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-1" },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ current_period_end: 1735689600 }] },
    });

    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userID: "user-1" },
        create: expect.objectContaining({
          userID: "user-1",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
          status: "ACTIVE",
        }),
      })
    );
  });

  it("updates status to PAST_DUE on customer.subscription.updated", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "past_due",
          items: { data: [{ current_period_end: 1735689600 }] },
        },
      },
    });
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      stripeCustomerId: "cus_123",
    } as any);

    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: "cus_123" },
        data: expect.objectContaining({ status: "PAST_DUE" }),
      })
    );
  });

  it("marks the subscription CANCELED on customer.subscription.deleted", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "canceled",
          items: { data: [] },
        },
      },
    });
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      stripeCustomerId: "cus_123",
    } as any);

    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELED" }),
      })
    );
  });

  it("does not throw when a subscription update references an unknown customer", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_999",
          customer: "cus_unknown",
          status: "active",
          items: { data: [] },
        },
      },
    });
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(200);
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});
