import { NextResponse } from "next/server";
import ccxt from "ccxt";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { encrypt, decrypt } from "@/lib/encryption";
import { mapCcxtTradeToTradeInput } from "@/lib/binanceSync";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

const MAX_SYMBOLS_PER_SYNC = 10;

// POST /api/exchanges/[id]/sync
// Body: { apiKey?, apiSecret?, symbols?: string[] }
// - If apiKey/apiSecret are provided, they're validated against Binance and stored
//   (encrypted), replacing any previously connected credentials for this exchange.
// - If omitted, the exchange must already have stored credentials, which are decrypted
//   and reused.
// - `symbols` (e.g. ["BTC/USDT"]) controls which pairs' trade history to import — Binance's
//   API has no "all trades across all pairs" endpoint, so this can't be auto-discovered.
//   Omit it to just validate/store credentials and refresh the account balance.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exchangeId } = await params;

    if (!exchangeId || !isValidObjectId(exchangeId)) {
      return NextResponse.json({ error: "Invalid exchange ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exchangeRecord = await prisma.exchange.findUnique({
      where: { id: exchangeId },
    });

    if (!exchangeRecord) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }

    if (exchangeRecord.traderID !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { apiKey, apiSecret, symbols } = body as {
      apiKey?: string;
      apiSecret?: string;
      symbols?: string[];
    };

    let resolvedApiKey: string;
    let resolvedApiSecret: string;
    let isReconnecting = false;

    if (apiKey || apiSecret) {
      if (
        typeof apiKey !== "string" ||
        typeof apiSecret !== "string" ||
        !apiKey.trim() ||
        !apiSecret.trim()
      ) {
        return NextResponse.json(
          { error: "Both apiKey and apiSecret are required to connect" },
          { status: 400 }
        );
      }
      resolvedApiKey = apiKey.trim();
      resolvedApiSecret = apiSecret.trim();
      isReconnecting = true;
    } else {
      if (!exchangeRecord.apiKeyEncrypted || !exchangeRecord.apiSecretEncrypted) {
        return NextResponse.json(
          { error: "This exchange has no connected API credentials yet" },
          { status: 400 }
        );
      }
      resolvedApiKey = decrypt(exchangeRecord.apiKeyEncrypted);
      resolvedApiSecret = decrypt(exchangeRecord.apiSecretEncrypted);
    }

    if (symbols !== undefined) {
      if (!Array.isArray(symbols) || symbols.some((s) => typeof s !== "string")) {
        return NextResponse.json(
          { error: "symbols must be an array of strings, e.g. [\"BTC/USDT\"]" },
          { status: 400 }
        );
      }
      if (symbols.length > MAX_SYMBOLS_PER_SYNC) {
        return NextResponse.json(
          { error: `A maximum of ${MAX_SYMBOLS_PER_SYNC} symbols can be synced at once` },
          { status: 400 }
        );
      }
    }

    const client = new ccxt.binance({
      apiKey: resolvedApiKey,
      secret: resolvedApiSecret,
      enableRateLimit: true,
    });

    let balanceUsdt: number | null = null;
    try {
      const balance = await client.fetchBalance();
      const total = (balance.total ?? {}) as unknown as Record<string, number>;
      balanceUsdt = typeof total.USDT === "number" ? Math.round(total.USDT) : null;
    } catch (err) {
      console.error("Binance credential validation failed:", err);
      return NextResponse.json(
        { error: "Could not authenticate with Binance. Check the API key and secret." },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const symbol of symbols ?? []) {
      const trades = await client.fetchMyTrades(symbol);

      for (const trade of trades) {
        if (!trade.id) continue;

        const mapped = mapCcxtTradeToTradeInput({
          id: trade.id,
          timestamp: trade.timestamp ?? Date.now(),
          symbol: trade.symbol ?? symbol,
          side: (trade.side as "buy" | "sell") ?? "buy",
          amount: trade.amount ?? 0,
          cost: trade.cost ?? 0,
        });

        const existing = await prisma.trade.findFirst({
          where: { exchangeID: exchangeId, externalId: mapped.externalId },
          select: { id: true },
        });

        if (existing) {
          skippedCount += 1;
          continue;
        }

        await prisma.trade.create({
          data: {
            ...mapped,
            exchangeID: exchangeId,
            traderID: currentUser.id,
            exchangeName: exchangeRecord.exchangeName,
          },
        });
        importedCount += 1;
      }
    }

    const updateData: Record<string, unknown> = {
      lastSyncedAt: new Date(),
    };
    if (isReconnecting) {
      updateData.apiKeyEncrypted = encrypt(resolvedApiKey);
      updateData.apiSecretEncrypted = encrypt(resolvedApiSecret);
      updateData.connectedAt = new Date();
    }
    if (balanceUsdt !== null) {
      updateData.balance = balanceUsdt;
    }

    await prisma.exchange.update({
      where: { id: exchangeId },
      data: updateData,
    });

    return NextResponse.json({
      connected: true,
      balanceUsdt,
      tradesImported: importedCount,
      tradesSkipped: skippedCount,
    });
  } catch (error) {
    console.error("Error syncing exchange:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
