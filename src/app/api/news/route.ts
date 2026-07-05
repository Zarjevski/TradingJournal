import Parser from "rss-parser";
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

export type NewsCategory = "crypto" | "forex" | "stocks";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  category: NewsCategory;
  publishedAt: string | null;
  imageUrl: string | null;
}

interface FeedConfig {
  url: string;
  source: string;
  category: NewsCategory;
}

// Free, no-auth RSS feeds — one well-known outlet per asset class.
const FEEDS: FeedConfig[] = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", category: "crypto" },
  { url: "https://www.forexlive.com/feed/news", source: "ForexLive", category: "forex" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance", category: "stocks" },
];

const ITEMS_PER_FEED = 15;

// Most of these feeds reject the default Node/undici user agent with a 403 or
// redirect loop, so a browser-like UA is required.
const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeDiaryNewsBot/1.0)" },
  timeout: 10_000,
});

let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchFeed(feed: FeedConfig): Promise<NewsItem[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items ?? []).slice(0, ITEMS_PER_FEED).map((item) => ({
      title: item.title?.trim() || "Untitled",
      link: item.link ?? "",
      source: feed.source,
      category: feed.category,
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      imageUrl: item.enclosure?.url ?? null,
    }));
  } catch (error) {
    // A single dead/rate-limited feed shouldn't take down the whole page.
    console.error(`Failed to fetch news feed "${feed.source}":`, error);
    return [];
  }
}

// GET /api/news?category=crypto|forex|stocks (optional filter)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!cache || Date.now() - cache.fetchedAt >= CACHE_TTL_MS) {
      const results = await Promise.all(FEEDS.map(fetchFeed));
      const items = results
        .flat()
        .filter((item) => item.link)
        .sort((a, b) => {
          const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bTime - aTime;
        });
      cache = { items, fetchedAt: Date.now() };
    }

    const items =
      category && ["crypto", "forex", "stocks"].includes(category)
        ? cache.items.filter((item) => item.category === category)
        : cache.items;

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
