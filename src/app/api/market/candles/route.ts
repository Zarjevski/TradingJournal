import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedMarket,
  isAllowedTf,
  mapTfToBinance,
  normalizeSymbolForBinance,
  type Candle,
  type Timeframe,
  type Market,
} from "@/lib/market";

const BINANCE_KLINES = "https://api.binance.com/api/v3/klines";

function parseQueryInt(value: string | null): number | null {
  if (value == null) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = (searchParams.get("market") ?? "crypto").toLowerCase();
    const symbol = searchParams.get("symbol")?.trim() ?? "";
    const tf = (searchParams.get("tf") ?? "15m").toLowerCase();
    const from = parseQueryInt(searchParams.get("from"));
    const to = parseQueryInt(searchParams.get("to"));

    if (!isAllowedMarket(market)) {
      return NextResponse.json(
        { error: "Invalid market. Use crypto, fx, or stocks." },
        { status: 400 }
      );
    }

    if (symbol.length < 1 || symbol.length > 30) {
      return NextResponse.json(
        { error: "Symbol must be between 1 and 30 characters." },
        { status: 400 }
      );
    }

    if (!isAllowedTf(tf)) {
      return NextResponse.json(
        { error: "Invalid timeframe. Use 1m, 5m, 15m, 1h, 4h, or 1d." },
        { status: 400 }
      );
    }

    if (from == null || to == null) {
      return NextResponse.json(
        { error: "Query params from and to (unix seconds) are required." },
        { status: 400 }
      );
    }

    if (from >= to) {
      return NextResponse.json(
        { error: "from must be less than to." },
        { status: 400 }
      );
    }

    if (market === "fx" || market === "stocks") {
      return NextResponse.json(
        { error: "Provider not configured for this market." },
        { status: 501 }
      );
    }

    const binanceSymbol = normalizeSymbolForBinance(symbol);
    const interval = mapTfToBinance(tf);
    const startTime = from * 1000;
    const endTime = to * 1000;

    const url = new URL(BINANCE_KLINES);
    url.searchParams.set("symbol", binanceSymbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("startTime", String(startTime));
    url.searchParams.set("endTime", String(endTime));
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      let message = "Failed to fetch candles.";
      try {
        const json = JSON.parse(text);
        if (json.msg) message = json.msg;
      } catch {
        if (text) message = text.slice(0, 200);
      }
      return NextResponse.json({ error: message }, { status: res.status >= 500 ? 502 : 400 });
    }

    const raw: [number, string, string, string, string, string, number, string, number, number, number, string][] =
      await res.json();

    const candles: Candle[] = raw.map(([openTime, o, h, l, c, vol]) => ({
      time: Math.floor(openTime / 1000),
      open: parseFloat(o),
      high: parseFloat(h),
      low: parseFloat(l),
      close: parseFloat(c),
      volume: parseFloat(String(vol)),
    }));

    return NextResponse.json(candles);
  } catch (error) {
    console.error("[/api/market/candles]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
