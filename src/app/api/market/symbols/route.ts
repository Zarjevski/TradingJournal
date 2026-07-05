import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import cryptocurrencies from "@/data/cryptocurrencies.json";

interface SymbolOption {
  value: string;
  label: string;
}

interface BinanceExchangeInfoSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
}

const nameByBaseAsset = new Map(
  (cryptocurrencies as Array<{ symbol: string; name: string }>).map((c) => [c.symbol, c.name])
);

// In-memory cache — Binance's tradeable pair list changes rarely, no need to
// re-fetch on every request. Refreshed at most once an hour.
let cache: { options: SymbolOption[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchBinanceSymbols(): Promise<SymbolOption[]> {
  const response = await fetch("https://api.binance.com/api/v3/exchangeInfo", {
    // Binance has no auth requirement for this endpoint; a server-side fetch
    // avoids CORS issues a browser-side call would hit.
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Binance exchangeInfo request failed: ${response.status}`);
  }

  const data = await response.json();
  const symbols = (data.symbols ?? []) as BinanceExchangeInfoSymbol[];

  const baseAssets = new Set<string>();
  for (const s of symbols) {
    if (s.status === "TRADING" && s.isSpotTradingAllowed && s.quoteAsset === "USDT") {
      baseAssets.add(s.baseAsset);
    }
  }

  return Array.from(baseAssets)
    .sort()
    .map((symbol) => ({
      value: symbol,
      label: nameByBaseAsset.get(symbol) ?? symbol,
    }));
}

// GET /api/market/symbols — live list of USDT-tradeable Binance base assets,
// for the trade-entry symbol autocomplete. Falls back to the bundled static
// list if Binance is unreachable, so the form never becomes unusable.
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({ symbols: cache.options, source: "binance" });
    }

    const options = await fetchBinanceSymbols();
    cache = { options, fetchedAt: Date.now() };

    return NextResponse.json({ symbols: options, source: "binance" });
  } catch (error) {
    console.error("Error fetching symbol list, falling back to static list:", error);
    const fallback = (cryptocurrencies as Array<{ symbol: string; name: string }>).map((c) => ({
      value: c.symbol,
      label: c.name,
    }));
    return NextResponse.json({ symbols: fallback, source: "fallback" });
  }
}
