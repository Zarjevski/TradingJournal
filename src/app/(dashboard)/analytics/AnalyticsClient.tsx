"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaDollarSign,
  FaChartLine,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPercent,
} from "react-icons/fa";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Table, { Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import Tabs from "@/components/ui/Tabs";
import { useColorMode } from "@/context/ColorModeContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface Exchange {
  id: string;
  exchangeName: string;
}

interface AnalyticsData {
  kpis: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgTrade: number;
    profitFactor: number;
    largestWin: number;
    largestLoss: number;
    avgWin: number;
    avgLoss: number;
  };
  cumulativePnLSeries: Array<{ date: string; value: number }>;
  drawdownSeries: Array<{ date: string; value: number }>;
  winLossCounts: {
    win: number;
    loss: number;
    breakeven: number;
    canceled: number;
  };
  byExchange: Array<{
    exchangeId?: string;
    exchangeName?: string;
    trades: number;
    winRate: number;
    totalPnL: number;
  }>;
  bySymbol: Array<{
    symbol?: string;
    trades: number;
    winRate: number;
    totalPnL: number;
  }>;
  byDirection: Array<{
    direction?: string;
    trades: number;
    winRate: number;
    totalPnL: number;
  }>;
  byStatus: Array<{
    status?: string;
    trades: number;
    winRate: number;
    totalPnL: number;
  }>;
  insights: Array<{
    severity: "info" | "warning";
    title: string;
    detail: string;
  }>;
}

interface AnalyticsClientProps {
  exchanges: Exchange[];
}

const AnalyticsClient: React.FC<AnalyticsClientProps> = ({ exchanges }) => {
  const { colorMode } = useColorMode();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default to last 90 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split("T")[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    exchangeId: "All",
    status: "All",
    direction: "All",
    symbol: "",
  });

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        start: filters.startDate,
        end: filters.endDate,
        exchangeId: filters.exchangeId,
        status: filters.status,
        direction: filters.direction,
        ...(filters.symbol && { symbol: filters.symbol }),
      });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await axios.get(`/api/analytics?${params.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 200 && response.data) {
          setData(response.data);
        } else {
          setError("Invalid response from server");
        }
      } catch (axiosError: any) {
        clearTimeout(timeoutId);
        if (axiosError.name === 'AbortError' || axiosError.code === 'ECONNABORTED') {
          setError("Request timed out. Please try again with a smaller date range.");
        } else {
          throw axiosError;
        }
      }
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to load analytics data";
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Memoized chart data
  const cumulativeChartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.cumulativePnLSeries.map((p) => {
        const date = new Date(p.date);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          label: "Cumulative P&L",
          data: data.cumulativePnLSeries.map((p) => p.value),
          borderColor: colorMode === "light" ? "#3182ce" : "#63b3ed",
          backgroundColor: colorMode === "light" ? "#3182ce20" : "#63b3ed20",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [data, colorMode]);

  const drawdownChartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.drawdownSeries.map((p) => {
        const date = new Date(p.date);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          label: "Drawdown",
          data: data.drawdownSeries.map((p) => p.value),
          borderColor: "#ef4444",
          backgroundColor: "#ef444420",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [data]);

  const winLossChartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: ["Win", "Loss", "Break Even", "Canceled"],
      datasets: [
        {
          data: [
            data.winLossCounts.win,
            data.winLossCounts.loss,
            data.winLossCounts.breakeven,
            data.winLossCounts.canceled,
          ],
          backgroundColor: [
            "#22c55e",
            "#ef4444",
            "#3b82f6",
            "#6b7280",
          ],
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: colorMode === "light" ? "#111827" : "#f9fafb",
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: colorMode === "light" ? "#e5e7eb" : "#374151",
        },
        ticks: {
          color: colorMode === "light" ? "#111827" : "#f9fafb",
        },
      },
      y: {
        grid: {
          color: colorMode === "light" ? "#e5e7eb" : "#374151",
        },
        ticks: {
          color: colorMode === "light" ? "#111827" : "#f9fafb",
        },
      },
    },
  };

  const kpiCards = data
    ? [
        {
          title: "Total Trades",
          value: data.kpis.totalTrades.toLocaleString(),
          icon: FaChartLine,
          color: "blue",
        },
        {
          title: "Win Rate",
          value: `${data.kpis.winRate.toFixed(1)}%`,
          icon: FaTrophy,
          color: "yellow",
        },
        {
          title: "Total P&L",
          value: `$${data.kpis.totalPnL.toLocaleString()}`,
          icon: FaDollarSign,
          color: data.kpis.totalPnL >= 0 ? "green" : "red",
        },
        {
          title: "Avg Trade",
          value: `$${data.kpis.avgTrade.toFixed(2)}`,
          icon: FaArrowUp,
          color: "purple",
        },
        {
          title: "Profit Factor",
          value: data.kpis.profitFactor.toFixed(2),
          icon: FaPercent,
          color: "teal",
        },
        {
          title: "Largest Win",
          value: `$${data.kpis.largestWin.toLocaleString()}`,
          icon: FaArrowUp,
          color: "green",
        },
      ]
    : [];

  const bgColor = colorMode === "light" ? "bg-gray-50" : "bg-gray-900";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  const getStatusColor = (status: string): string => {
    const s = status.toUpperCase();
    if (s === "WIN") return "bg-green-500";
    if (s === "LOSS") return "bg-red-500";
    if (s === "BREAK_EVEN") return "bg-blue-500";
    if (s === "CANCELED") return "bg-gray-500";
    return "bg-gray-500";
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { 
        bg: colorMode === "light" ? "bg-blue-50" : "bg-blue-900", 
        text: "text-blue-500" 
      },
      yellow: { 
        bg: colorMode === "light" ? "bg-yellow-50" : "bg-yellow-900", 
        text: "text-yellow-500" 
      },
      green: { 
        bg: colorMode === "light" ? "bg-green-50" : "bg-green-900", 
        text: "text-green-500" 
      },
      red: { 
        bg: colorMode === "light" ? "bg-red-50" : "bg-red-900", 
        text: "text-red-500" 
      },
      purple: { 
        bg: colorMode === "light" ? "bg-purple-50" : "bg-purple-900", 
        text: "text-purple-500" 
      },
      teal: { 
        bg: colorMode === "light" ? "bg-teal-50" : "bg-teal-900", 
        text: "text-teal-500" 
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  const segmentationTabs = data ? [
    {
      id: "exchange",
      label: "By Exchange",
      content: (
        <div className="overflow-x-auto">
          <Table className={`min-w-full divide-y ${
            colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
          }`}>
            <Thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
              <Tr>
                <Th>Exchange</Th>
                <Th>Trades</Th>
                <Th>Win Rate</Th>
                <Th className="text-right">Total P&L</Th>
              </Tr>
            </Thead>
            <Tbody className={`${cardBg} divide-y ${
              colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
            }`}>
              {data.byExchange.map((row, index) => (
                <Tr key={index}>
                  <Td className="font-semibold">{row.exchangeName}</Td>
                  <Td>{row.trades}</Td>
                  <Td>{row.winRate.toFixed(1)}%</Td>
                  <Td
                    className={`text-right font-semibold ${
                      row.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${row.totalPnL.toLocaleString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ),
    },
    {
      id: "symbol",
      label: "By Symbol",
      content: (
        <div className="overflow-x-auto">
          <Table className={`min-w-full divide-y ${
            colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
          }`}>
            <Thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
              <Tr>
                <Th>Symbol</Th>
                <Th>Trades</Th>
                <Th>Win Rate</Th>
                <Th className="text-right">Total P&L</Th>
              </Tr>
            </Thead>
            <Tbody className={`${cardBg} divide-y ${
              colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
            }`}>
              {data.bySymbol.map((row, index) => (
                <Tr key={index}>
                  <Td className="font-semibold">{row.symbol}</Td>
                  <Td>{row.trades}</Td>
                  <Td>{row.winRate.toFixed(1)}%</Td>
                  <Td
                    className={`text-right font-semibold ${
                      row.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${row.totalPnL.toLocaleString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ),
    },
    {
      id: "direction",
      label: "By Direction",
      content: (
        <div className="overflow-x-auto">
          <Table className={`min-w-full divide-y ${
            colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
          }`}>
            <Thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
              <Tr>
                <Th>Direction</Th>
                <Th>Trades</Th>
                <Th>Win Rate</Th>
                <Th className="text-right">Total P&L</Th>
              </Tr>
            </Thead>
            <Tbody className={`${cardBg} divide-y ${
              colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
            }`}>
              {data.byDirection.map((row, index) => (
                <Tr key={index}>
                  <Td className="font-semibold">{row.direction}</Td>
                  <Td>{row.trades}</Td>
                  <Td>{row.winRate.toFixed(1)}%</Td>
                  <Td
                    className={`text-right font-semibold ${
                      row.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${row.totalPnL.toLocaleString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ),
    },
    {
      id: "status",
      label: "By Status",
      content: (
        <div className="overflow-x-auto">
          <Table className={`min-w-full divide-y ${
            colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
          }`}>
            <Thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
              <Tr>
                <Th>Status</Th>
                <Th>Trades</Th>
                <Th className="text-right">Total P&L</Th>
              </Tr>
            </Thead>
            <Tbody className={`${cardBg} divide-y ${
              colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
            }`}>
              {data.byStatus.map((row, index) => (
                <Tr key={index}>
                  <Td>
                    <Badge className={getStatusColor(row.status || "")}>
                      {row.status}
                    </Badge>
                  </Td>
                  <Td>{row.trades}</Td>
                  <Td
                    className={`text-right font-semibold ${
                      row.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${row.totalPnL.toLocaleString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ),
    },
  ] : [];

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className={`text-sm ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            Historical performance analysis and insights
          </p>
        </div>

        {/* Filters */}
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exchange</label>
                <Select
                  value={filters.exchangeId}
                  onChange={(e) =>
                    setFilters({ ...filters, exchangeId: e.target.value })
                  }
                >
                  <option value="All">All</option>
                  {exchanges.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.exchangeName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="All">All</option>
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAK_EVEN">BREAK_EVEN</option>
                  <option value="CANCELED">CANCELED</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <Select
                  value={filters.direction}
                  onChange={(e) =>
                    setFilters({ ...filters, direction: e.target.value })
                  }
                >
                  <option value="All">All</option>
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <Input
                  placeholder="Search symbol..."
                  value={filters.symbol}
                  onChange={(e) =>
                    setFilters({ ...filters, symbol: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              variant="primary"
              onClick={fetchAnalytics}
              isLoading={isLoading}
            >
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className={`${cardBg} ${borderColor} border`}>
                <div className="p-4">
                  <div className={`h-16 rounded animate-pulse ${
                    colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
                  }`}></div>
                </div>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((kpi, index) => {
              const IconComponent = kpi.icon;
              const colorClasses = getColorClasses(kpi.color);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${cardBg} ${borderColor} border`}>
                    <div className="p-4">
                      <div className={`flex items-center gap-3 mb-2 p-2 rounded-md ${colorClasses.bg}`}>
                        <IconComponent className={`h-5 w-5 ${colorClasses.text}`} />
                      </div>
                      <p className={`text-sm font-medium mb-1 ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                        {kpi.title}
                      </p>
                      <h3 className="text-2xl font-bold">{kpi.value}</h3>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="p-4">
                <div className={`h-[300px] rounded animate-pulse ${
                  colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
                }`}></div>
              </div>
            </Card>
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="p-4">
                <div className={`h-[300px] rounded animate-pulse ${
                  colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
                }`}></div>
              </div>
            </Card>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Cumulative P&L</h3>
                <div className="h-[300px]">
                  {cumulativeChartData && (
                    <Line data={cumulativeChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </Card>
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Drawdown</h3>
                <div className="h-[300px]">
                  {drawdownChartData && (
                    <Line data={drawdownChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Win/Loss Chart */}
        {isLoading ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <div className={`h-[300px] rounded animate-pulse ${
                colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
              }`}></div>
            </div>
          </Card>
        ) : data ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
              <div className="h-[300px] flex justify-center items-center">
                {winLossChartData && (
                  <div className="w-[300px] h-[300px]">
                    <Doughnut
                      data={winLossChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: "bottom" as const,
                            labels: {
                              color: colorMode === "light" ? "#111827" : "#f9fafb",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {/* Segmentations */}
        {isLoading ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-4 rounded animate-pulse ${
                    colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
                  }`}></div>
                ))}
              </div>
            </div>
          </Card>
        ) : data ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Segmentations</h2>
              {segmentationTabs.length > 0 && (
                <Tabs tabs={segmentationTabs} />
              )}
            </div>
          </Card>
        ) : null}

        {/* Insights */}
        {isLoading ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-4 rounded animate-pulse ${
                    colorMode === "light" ? "bg-gray-200" : "bg-gray-700"
                  }`}></div>
                ))}
              </div>
            </div>
          </Card>
        ) : data && data.insights.length > 0 ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Insights</h2>
              <div className="space-y-3">
                {data.insights.map((insight, index) => (
                  <Alert
                    key={index}
                    variant={insight.severity === "warning" ? "warning" : "info"}
                    title={insight.title}
                  >
                    {insight.detail}
                  </Alert>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {/* Empty State */}
        {!isLoading && !error && data && data.kpis.totalTrades === 0 && (
          <Card className={`${cardBg} ${borderColor} border`}>
            <div className="p-4">
              <p className={`text-center py-8 italic ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                No trades found in the selected range. Try adjusting your filters.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalyticsClient;
