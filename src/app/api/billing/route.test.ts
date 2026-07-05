import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

const mockPortalSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    billingPortal: { sessions: { create: mockPortalSessionsCreate } },
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

describe("POST /api/billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("returns 404 when the user has no subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(404);
  });

  it("returns the billing portal URL on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      stripeCustomerId: "cus_123",
    } as any);
    mockPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/session1" });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://billing.stripe.com/session1");
    expect(mockPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123" })
    );
  });
});
