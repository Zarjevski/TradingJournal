import { describe, it, expect } from "vitest";
import { getStatusBadgeClass, formatStatusLabel, getPositionBadgeClass } from "./tradeStatus";

describe("getStatusBadgeClass", () => {
  it("keeps green for WIN and red for LOSS (the P&L exception)", () => {
    expect(getStatusBadgeClass("WIN")).toBe("bg-green-500");
    expect(getStatusBadgeClass("LOSS")).toBe("bg-red-500");
  });

  it("is case-insensitive", () => {
    expect(getStatusBadgeClass("win")).toBe("bg-green-500");
  });

  it("returns grayscale classes for non-P&L statuses", () => {
    expect(getStatusBadgeClass("PENDING")).toBe("bg-zinc-400");
    expect(getStatusBadgeClass("BREAK_EVEN")).toBe("bg-zinc-500");
    expect(getStatusBadgeClass("CANCELED")).toBe("bg-zinc-600");
  });

  it("falls back to a neutral class for unknown statuses", () => {
    expect(getStatusBadgeClass("SOMETHING_ELSE")).toBe("bg-zinc-500");
  });
});

describe("formatStatusLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(formatStatusLabel("BREAK_EVEN")).toBe("BREAK EVEN");
  });
});

describe("getPositionBadgeClass", () => {
  it("distinguishes LONG and SHORT", () => {
    expect(getPositionBadgeClass("LONG")).toBe("bg-zinc-700");
    expect(getPositionBadgeClass("SHORT")).toBe("bg-zinc-500");
  });

  it("falls back to a neutral class for unknown positions", () => {
    expect(getPositionBadgeClass("SIDEWAYS")).toBe("bg-zinc-600");
  });
});
