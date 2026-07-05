// Maps a CCXT unified trade object (as returned by exchange.fetchMyTrades()) onto the shape
// this app's Trade model expects. Kept separate from the API route so the mapping logic is
// unit-testable without needing a live exchange connection.
//
// Known limitations (can't be fixed without either a live Binance account to verify against,
// or a larger accounting engine than fits this MVP):
// - CCXT/Binance's spot trade-history endpoint requires a specific symbol per call — there's
//   no "fetch every trade across every pair" endpoint, so the sync route takes an explicit
//   list of symbols to check rather than auto-discovering a user's full trading history.
// - Realized P&L isn't computed. A single fill (a "trade" in the exchange's sense) is one
//   side of a position, not a closed round-trip — turning fills into a win/loss P&L number
//   requires FIFO/cost-basis matching against prior fills, which isn't implemented here.
//   Imported trades land as PENDING with result 0; treat this as raw fill history to review
//   and annotate, not a finished journal entry.
// - `size` is mapped from the trade's quote-currency notional (`cost`, e.g. its USDT value)
//   to match how this app's manual "Add Trade" form already treats size (an "amount in
//   dollars" field), not the base-asset quantity.

export interface CcxtTrade {
  id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  cost: number;
}

export interface MappedTradeInput {
  externalId: string;
  symbol: string;
  position: "LONG" | "SHORT";
  size: number;
  date: Date;
  status: "PENDING";
  result: number;
  margin: string;
  reason: string;
}

export function mapCcxtTradeToTradeInput(trade: CcxtTrade): MappedTradeInput {
  return {
    externalId: String(trade.id),
    symbol: trade.symbol.replace("/", ""),
    position: trade.side === "buy" ? "LONG" : "SHORT",
    size: Math.max(0, Math.round(trade.cost)),
    date: new Date(trade.timestamp),
    status: "PENDING",
    result: 0,
    margin: "N/A",
    reason: "Imported from Binance API",
  };
}
