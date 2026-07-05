import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

const { parseURLMock } = vi.hoisted(() => ({ parseURLMock: vi.fn() }));
vi.mock("rss-parser", () => ({
  default: vi.fn().mockImplementation(function MockParser(this: any) {
    this.parseURL = parseURLMock;
  }),
}));

import getCurrentUser from "@/app/actions/getCurrentUser";

function makeRequest(query = "") {
  return new Request(`http://localhost/api/news${query}`);
}

// The route caches fetched items at module scope, so each test that cares
// about triggering a real fetch (rather than reusing a warm cache) imports a
// fresh copy of the module via vi.resetModules().
async function freshGet() {
  vi.resetModules();
  const mod = await import("./route");
  return mod.GET;
}

describe("GET /api/news", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const GET = await freshGet();

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });

  it("returns an empty list rather than failing when every feed errors out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    parseURLMock.mockRejectedValue(new Error("feed unreachable"));
    const GET = await freshGet();

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });

  it("merges and sorts items from all feeds by publish date, newest first", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    parseURLMock
      .mockResolvedValueOnce({
        items: [{ title: "Old crypto news", link: "https://a.test/1", isoDate: "2026-01-01T00:00:00.000Z" }],
      })
      .mockResolvedValueOnce({
        items: [{ title: "New forex news", link: "https://b.test/1", isoDate: "2026-06-01T00:00:00.000Z" }],
      })
      .mockResolvedValueOnce({
        items: [{ title: "Stock news", link: "https://c.test/1", isoDate: "2026-03-01T00:00:00.000Z" }],
      });
    const GET = await freshGet();

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items.map((i: any) => i.title)).toEqual([
      "New forex news",
      "Stock news",
      "Old crypto news",
    ]);
  });

  it("filters by category when provided", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    parseURLMock
      .mockResolvedValueOnce({
        items: [{ title: "Crypto item", link: "https://a.test/1", isoDate: "2026-01-01T00:00:00.000Z" }],
      })
      .mockResolvedValueOnce({
        items: [{ title: "Forex item", link: "https://b.test/1", isoDate: "2026-06-01T00:00:00.000Z" }],
      })
      .mockResolvedValueOnce({
        items: [{ title: "Stock item", link: "https://c.test/1", isoDate: "2026-03-01T00:00:00.000Z" }],
      });
    const GET = await freshGet();

    const response = await GET(makeRequest("?category=forex"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([
      expect.objectContaining({ title: "Forex item", category: "forex" }),
    ]);
  });
});
