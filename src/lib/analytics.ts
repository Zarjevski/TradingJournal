import { prisma } from "./prisma";

export interface Trade {
  id: string;
  exchangeID: string;
  exchangeName: string;
  symbol: string;
  position: string;
  margin: string;
  date: Date;
  status: string;
  size: number;
  reason: string;
  result: number;
}

export interface AnalyticsKPIs {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgTrade: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface WinLossCounts {
  win: number;
  loss: number;
  breakeven: number;
  canceled: number;
}

export interface SegmentationRow {
  exchangeId?: string;
  exchangeName?: string;
  symbol?: string;
  direction?: string;
  status?: string;
  trades: number;
  winRate: number;
  totalPnL: number;
}

export interface Insight {
  severity: "info" | "warning";
  title: string;
  detail: string;
}

export interface AnalyticsData {
  kpis: AnalyticsKPIs;
  cumulativePnLSeries: ChartDataPoint[];
  drawdownSeries: ChartDataPoint[];
  winLossCounts: WinLossCounts;
  byExchange: SegmentationRow[];
  bySymbol: SegmentationRow[];
  byDirection: SegmentationRow[];
  byStatus: SegmentationRow[];
  insights: Insight[];
}

export function computeAnalytics(
  trades: Trade[],
  exchanges: Array<{ id: string; exchangeName: string }>
): AnalyticsData {
  // Filter out PENDING trades
  const filteredTrades = trades.filter((t) => t.status !== "PENDING");

  if (filteredTrades.length === 0) {
    return getEmptyAnalytics();
  }

  // Compute KPIs
  const kpis = computeKPIs(filteredTrades);

  // Compute chart series
  const cumulativePnLSeries = computeCumulativePnL(filteredTrades);
  const drawdownSeries = computeDrawdown(cumulativePnLSeries);

  // Compute win/loss counts
  const winLossCounts = computeWinLossCounts(filteredTrades);

  // Compute segmentations
  const byExchange = computeByExchange(filteredTrades, exchanges);
  const bySymbol = computeBySymbol(filteredTrades);
  const byDirection = computeByDirection(filteredTrades);
  const byStatus = computeByStatus(filteredTrades);

  // Compute insights
  const insights = computeInsights(
    kpis,
    bySymbol,
    byDirection,
    filteredTrades
  );

  return {
    kpis,
    cumulativePnLSeries,
    drawdownSeries,
    winLossCounts,
    byExchange,
    bySymbol,
    byDirection,
    byStatus,
    insights,
  };
}

function getEmptyAnalytics(): AnalyticsData {
  return {
    kpis: {
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      avgTrade: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      avgWin: 0,
      avgLoss: 0,
    },
    cumulativePnLSeries: [],
    drawdownSeries: [],
    winLossCounts: {
      win: 0,
      loss: 0,
      breakeven: 0,
      canceled: 0,
    },
    byExchange: [],
    bySymbol: [],
    byDirection: [],
    byStatus: [],
    insights: [],
  };
}

function computeKPIs(trades: Trade[]): AnalyticsKPIs {
  const totalTrades = trades.length;
  const totalPnL = trades.reduce((sum, t) => sum + t.result, 0);
  const avgTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;

  // Single pass to collect win/loss data (more memory efficient)
  let winCount = 0;
  let lossCount = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalLossAmount = 0; // Sum of loss results (negative values)
  let largestWin = 0;
  let largestLoss = 0;

  for (const trade of trades) {
    if (trade.status === "WIN") {
      winCount++;
      totalWins += trade.result;
      if (trade.result > largestWin) {
        largestWin = trade.result;
      }
    } else if (trade.status === "LOSS") {
      lossCount++;
      totalLosses += Math.abs(trade.result);
      totalLossAmount += trade.result; // This will be negative
      if (trade.result < largestLoss) {
        largestLoss = trade.result;
      }
    }
  }

  const winRate =
    winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  const avgWin = winCount > 0 ? totalWins / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

  return {
    totalTrades,
    winRate: isFinite(winRate) ? winRate : 0,
    totalPnL: isFinite(totalPnL) ? totalPnL : 0,
    avgTrade: isFinite(avgTrade) ? avgTrade : 0,
    profitFactor: isFinite(profitFactor) ? profitFactor : 0,
    largestWin: isFinite(largestWin) ? largestWin : 0,
    largestLoss: isFinite(largestLoss) ? largestLoss : 0,
    avgWin: isFinite(avgWin) ? avgWin : 0,
    avgLoss: isFinite(avgLoss) ? avgLoss : 0,
  };
}

function computeCumulativePnL(trades: Trade[]): ChartDataPoint[] {
  // Sort by date ascending
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group by date and aggregate
  const byDate = new Map<string, number>();
  for (const trade of sorted) {
    const dateStr = new Date(trade.date).toISOString().split("T")[0];
    byDate.set(dateStr, (byDate.get(dateStr) || 0) + trade.result);
  }

  // Compute cumulative sum
  const dates = Array.from(byDate.keys()).sort();
  let cumulative = 0;
  const series: ChartDataPoint[] = [];

  for (const date of dates) {
    cumulative += byDate.get(date) || 0;
    series.push({ date, value: cumulative });
  }

  return series;
}

function computeDrawdown(
  cumulativeSeries: ChartDataPoint[]
): ChartDataPoint[] {
  let runningPeak = 0;
  const drawdown: ChartDataPoint[] = [];

  for (const point of cumulativeSeries) {
    if (point.value > runningPeak) {
      runningPeak = point.value;
    }
    drawdown.push({
      date: point.date,
      value: point.value - runningPeak, // Negative or zero
    });
  }

  return drawdown;
}

function computeWinLossCounts(trades: Trade[]): WinLossCounts {
  // Single pass instead of multiple filters (more memory efficient)
  let win = 0;
  let loss = 0;
  let breakeven = 0;
  let canceled = 0;

  for (const trade of trades) {
    switch (trade.status) {
      case "WIN":
        win++;
        break;
      case "LOSS":
        loss++;
        break;
      case "BREAK_EVEN":
        breakeven++;
        break;
      case "CANCELED":
        canceled++;
        break;
    }
  }

  return { win, loss, breakeven, canceled };
}

function computeByExchange(
  trades: Trade[],
  exchanges: Array<{ id: string; exchangeName: string }>
): SegmentationRow[] {
  const byExchange = new Map<
    string,
    { trades: Trade[]; exchangeName: string }
  >();

  for (const trade of trades) {
    const key = trade.exchangeID;
    if (!byExchange.has(key)) {
      const exchange = exchanges.find((e) => e.id === key);
      byExchange.set(key, {
        trades: [],
        exchangeName: exchange?.exchangeName || trade.exchangeName,
      });
    }
    byExchange.get(key)!.trades.push(trade);
  }

  const rows: SegmentationRow[] = [];
  for (const [exchangeId, data] of Array.from(byExchange.entries())) {
    const segmentTrades = data.trades;
    // Single pass for win/loss counting and P&L
    let winCount = 0;
    let lossCount = 0;
    let totalPnL = 0;
    for (const trade of segmentTrades) {
      if (trade.status === "WIN") winCount++;
      else if (trade.status === "LOSS") lossCount++;
      totalPnL += trade.result;
    }
    const winRate =
      winCount + lossCount > 0
        ? (winCount / (winCount + lossCount)) * 100
        : 0;

    rows.push({
      exchangeId,
      exchangeName: data.exchangeName,
      trades: segmentTrades.length,
      winRate: isFinite(winRate) ? winRate : 0,
      totalPnL: isFinite(totalPnL) ? totalPnL : 0,
    });
  }

  // Sort by totalPnL desc
  return rows.sort((a, b) => b.totalPnL - a.totalPnL);
}

function computeBySymbol(trades: Trade[]): SegmentationRow[] {
  const bySymbol = new Map<string, Trade[]>();

  for (const trade of trades) {
    const key = trade.symbol;
    if (!bySymbol.has(key)) {
      bySymbol.set(key, []);
    }
    bySymbol.get(key)!.push(trade);
  }

  const rows: SegmentationRow[] = [];
  for (const [symbol, segmentTrades] of Array.from(bySymbol.entries())) {
    // Single pass for win/loss counting and P&L
    let winCount = 0;
    let lossCount = 0;
    let totalPnL = 0;
    for (const trade of segmentTrades) {
      if (trade.status === "WIN") winCount++;
      else if (trade.status === "LOSS") lossCount++;
      totalPnL += trade.result;
    }
    const winRate =
      winCount + lossCount > 0
        ? (winCount / (winCount + lossCount)) * 100
        : 0;

    rows.push({
      symbol,
      trades: segmentTrades.length,
      winRate: isFinite(winRate) ? winRate : 0,
      totalPnL: isFinite(totalPnL) ? totalPnL : 0,
    });
  }

  // Sort by totalPnL desc
  return rows.sort((a, b) => b.totalPnL - a.totalPnL);
}

function computeByDirection(trades: Trade[]): SegmentationRow[] {
  const byDirection = new Map<string, Trade[]>();

  for (const trade of trades) {
    const key = trade.position.toUpperCase();
    if (!byDirection.has(key)) {
      byDirection.set(key, []);
    }
    byDirection.get(key)!.push(trade);
  }

  const rows: SegmentationRow[] = [];
  for (const [direction, segmentTrades] of Array.from(byDirection.entries())) {
    // Single pass for win/loss counting and P&L
    let winCount = 0;
    let lossCount = 0;
    let totalPnL = 0;
    for (const trade of segmentTrades) {
      if (trade.status === "WIN") winCount++;
      else if (trade.status === "LOSS") lossCount++;
      totalPnL += trade.result;
    }
    const winRate =
      winCount + lossCount > 0
        ? (winCount / (winCount + lossCount)) * 100
        : 0;

    rows.push({
      direction: direction as "LONG" | "SHORT",
      trades: segmentTrades.length,
      winRate: isFinite(winRate) ? winRate : 0,
      totalPnL: isFinite(totalPnL) ? totalPnL : 0,
    });
  }

  return rows;
}

function computeByStatus(trades: Trade[]): SegmentationRow[] {
  const byStatus = new Map<string, Trade[]>();

  for (const trade of trades) {
    const key = trade.status;
    if (!byStatus.has(key)) {
      byStatus.set(key, []);
    }
    byStatus.get(key)!.push(trade);
  }

  const rows: SegmentationRow[] = [];
  for (const [status, segmentTrades] of Array.from(byStatus.entries())) {
    const totalPnL = segmentTrades.reduce((sum, t) => sum + t.result, 0);

    rows.push({
      status,
      trades: segmentTrades.length,
      winRate: 0, // Not applicable for status segmentation
      totalPnL: isFinite(totalPnL) ? totalPnL : 0,
    });
  }

  // Sort by trades desc
  return rows.sort((a, b) => b.trades - a.trades);
}

function computeInsights(
  kpis: AnalyticsKPIs,
  bySymbol: SegmentationRow[],
  byDirection: SegmentationRow[],
  trades: Trade[]
): Insight[] {
  const insights: Insight[] = [];

  // Net negative performance
  if (kpis.totalPnL < 0) {
    insights.push({
      severity: "warning",
      title: "Net Negative Performance",
      detail: `Total P&L is negative ($${kpis.totalPnL.toLocaleString()}) in the selected range.`,
    });
  }

  // LONG vs SHORT performance
  const longDirection = byDirection.find((d) => d.direction === "LONG");
  const shortDirection = byDirection.find((d) => d.direction === "SHORT");
  if (shortDirection && longDirection) {
    if (shortDirection.totalPnL < 0 && longDirection.totalPnL > 0) {
      insights.push({
        severity: "info",
        title: "LONG Outperforms SHORT",
        detail: `LONG positions are profitable while SHORT positions are losing money.`,
      });
    }
  }

  // Symbol contributing >35% of losses (optimized single pass)
  let totalLosses = 0;
  const symbolLossMap = new Map<string, number>();
  
  for (const trade of trades) {
    if (trade.status === "LOSS") {
      const lossAmount = Math.abs(trade.result);
      totalLosses += lossAmount;
      const current = symbolLossMap.get(trade.symbol) || 0;
      symbolLossMap.set(trade.symbol, current + lossAmount);
    }
  }
  
  if (totalLosses > 0) {
    for (const symbol of bySymbol) {
      if (!symbol.symbol) continue;
      const symbolLosses = symbolLossMap.get(symbol.symbol) || 0;
      const percentage = (symbolLosses / totalLosses) * 100;
      if (percentage > 35) {
        insights.push({
          severity: "warning",
          title: "High Loss Concentration",
          detail: `${symbol.symbol} contributes ${percentage.toFixed(1)}% of total losses.`,
        });
        break; // Only show one
      }
    }
  }

  // Pareto: Top 20% symbols contribute >80% of profits (optimized)
  let totalProfits = 0;
  for (const trade of trades) {
    if (trade.status === "WIN") {
      totalProfits += trade.result;
    }
  }
  
  if (totalProfits > 0 && bySymbol.length > 0) {
    const profitableSymbols = bySymbol
      .filter((s) => s.totalPnL > 0)
      .sort((a, b) => b.totalPnL - a.totalPnL);
    const top20Count = Math.ceil(profitableSymbols.length * 0.2);
    const top20Profits = profitableSymbols
      .slice(0, top20Count)
      .reduce((sum, s) => sum + s.totalPnL, 0);
    const percentage = (top20Profits / totalProfits) * 100;
    if (percentage > 80) {
      insights.push({
        severity: "info",
        title: "Pareto Distribution",
        detail: `Top 20% of symbols contribute ${percentage.toFixed(1)}% of profits.`,
      });
    }
  }

  // Profit factor < 1
  if (kpis.profitFactor > 0 && kpis.profitFactor < 1) {
    insights.push({
      severity: "warning",
      title: "Low Profit Factor",
      detail: `Profit factor is ${kpis.profitFactor.toFixed(2)} (below 1.0). Losses exceed wins.`,
    });
  }

  return insights;
}
