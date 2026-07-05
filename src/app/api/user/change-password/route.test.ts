import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => true),
  getClientIp: vi.fn(() => "unknown"),
}));

import { PATCH } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/user/change-password", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const STRONG_PASSWORD = "NewPassword123";

describe("PATCH /api/user/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await PATCH(
      makeRequest({ currentPassword: "old", newPassword: STRONG_PASSWORD })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when the new password is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);

    const response = await PATCH(makeRequest({ currentPassword: "old" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when the new password fails strength requirements", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);

    const response = await PATCH(
      makeRequest({ currentPassword: "old", newPassword: "short" })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for Google-only accounts with no password set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: null } as any);

    const response = await PATCH(
      makeRequest({ currentPassword: "old", newPassword: STRONG_PASSWORD })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when currentPassword is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "hashed" } as any);

    const response = await PATCH(makeRequest({ newPassword: STRONG_PASSWORD }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when currentPassword doesn't match", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "hashed" } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const response = await PATCH(
      makeRequest({ currentPassword: "wrong", newPassword: STRONG_PASSWORD })
    );

    expect(response.status).toBe(400);
  });

  it("updates the password on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "hashed" } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("new-hashed" as never);

    const response = await PATCH(
      makeRequest({ currentPassword: "correct", newPassword: STRONG_PASSWORD })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hashed" },
    });
  });
});
