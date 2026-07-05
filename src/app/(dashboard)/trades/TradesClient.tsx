"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaSearch, FaArrowLeft, FaArrowRight, FaEye, FaChevronDown, FaChevronUp, FaTable, FaRegCalendarAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table, { Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import type { DayAggregate } from "@/components/calendar/DayCell";
import { useColorMode } from "@/context/ColorModeContext";
import useNewTradeForm from "@/hooks/useNewTradeForm";
import { getStatusBadgeClass, getPositionBadgeClass, formatStatusLabel } from "@/lib/tradeStatus";
import { formatDate } from "@/lib/dateFormat";

interface TradeRow {
  id: string;
  date: Date | string;
  symbol: string;
  exchangeName: string;
  position: string;
  status: string;
  size: number;
  result: number;
}

interface Exchange {
  id: string;
  exchangeName: string;
}

interface TradesResponse {
  items: TradeRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TradesClientProps {
  initialTrades: TradeRow[];
  initialTotal: number;
  exchanges: Exchange[];
  initialExchangeId?: string;
}

const startOfMonthUTC = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const monthParam = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const TradesClient: React.FC<TradesClientProps> = ({
  initialTrades,
  initialTotal,
  exchanges,
  initialExchangeId,
}) => {
  const { colorMode } = useColorMode();
  const router = useRouter();
   const newTrade = useNewTradeForm();

  const [trades, setTrades] = useState<TradeRow[]>(initialTrades);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 25));

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonthUTC(new Date()));
  const [calendarDays, setCalendarDays] = useState<DayAggregate[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "All",
    exchangeId: initialExchangeId || "All",
    position: "All",
    symbol: "",
    from: "",
    to: "",
  });

  const fetchTrades = useCallback(
    async (
      pageNum: number = page,
      customFilters: typeof filters = filters,
      customPageSize: number = pageSize
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          pageSize: customPageSize.toString(),
          ...(customFilters.status !== "All" && { status: customFilters.status }),
          ...(customFilters.exchangeId !== "All" && { exchangeId: customFilters.exchangeId }),
          ...(customFilters.position !== "All" && { position: customFilters.position }),
          ...(customFilters.symbol.trim() && { symbol: customFilters.symbol.trim() }),
          ...(customFilters.from && { from: customFilters.from }),
          ...(customFilters.to && { to: customFilters.to }),
        });

        const response = await axios.get<TradesResponse>(
          `/api/trades?${params.toString()}`
        );

        if (response.data) {
          setTrades(response.data.items);
          setPage(response.data.page);
          setTotal(response.data.total);
          setTotalPages(response.data.totalPages);
        }
      } catch (err: any) {
        console.error("Error fetching trades:", err);
        setError(
          err.response?.data?.error || "Failed to load trades. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pageSize, page]
  );

  // If we arrived here with a pre-selected account (e.g. from an account's
  // "View all in Trades" link), the initial server-rendered trades aren't scoped to
  // it yet — fetch the filtered list once on mount.
  useEffect(() => {
    if (initialExchangeId) {
      fetchTrades(1, filters, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMonth = useCallback(async (date: Date) => {
    setIsCalendarLoading(true);
    setCalendarError(null);
    try {
      const response = await axios.get<{ days: DayAggregate[] }>(
        `/api/trades/calendar?month=${monthParam(date)}`
      );
      setCalendarDays(response.data.days);
    } catch (err) {
      console.error("Error fetching calendar trades:", err);
      setCalendarError("Failed to load calendar data. Please try again.");
    } finally {
      setIsCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "calendar") {
      fetchMonth(monthDate);
    }
  }, [viewMode, monthDate, fetchMonth]);

  const calendarAggregatesByDate = useMemo(() => {
    const map = new Map<string, DayAggregate>();
    for (const day of calendarDays) {
      map.set(day.date, day);
    }
    return map;
  }, [calendarDays]);

  const calendarMonthlySummary = useMemo(() => {
    const netPnl = calendarDays.reduce((sum, d) => sum + d.netPnl, 0);
    const tradeCount = calendarDays.reduce((sum, d) => sum + d.tradeCount, 0);
    return { netPnl, tradeCount };
  }, [calendarDays]);

  const handleCalendarDayClick = (dateKey: string) => {
    const dayFilters = { ...filters, from: dateKey, to: dateKey };
    setFilters(dayFilters);
    setFiltersOpen(true);
    setPage(1);
    setViewMode("table");
    fetchTrades(1, dayFilters, pageSize);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchTrades(1, filters, pageSize);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: "All",
      exchangeId: "All",
      position: "All",
      symbol: "",
      from: "",
      to: "",
    };
    setFilters(resetFilters);
    setPage(1);
    fetchTrades(1, resetFilters, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTrades(newPage, filters, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    fetchTrades(1, filters, newSize);
  };

  const formatResult = (result: number): string => {
    return result >= 0 ? `+$${result.toLocaleString()}` : `-$${Math.abs(result).toLocaleString()}`;
  };

  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Trades"
          subtitle="View, filter, and manage every trade you've logged"
          actions={
            <>
              <div
                className={`inline-flex rounded-lg border p-1 ${borderColor} ${
                  colorMode === "light" ? "bg-white" : "bg-zinc-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "table"
                      ? colorMode === "light"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-900"
                      : colorMode === "light"
                      ? "text-gray-600 hover:bg-zinc-100"
                      : "text-gray-400 hover:bg-zinc-800"
                  }`}
                >
                  <FaTable className="h-3.5 w-3.5" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "calendar"
                      ? colorMode === "light"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-900"
                      : colorMode === "light"
                      ? "text-gray-600 hover:bg-zinc-100"
                      : "text-gray-400 hover:bg-zinc-800"
                  }`}
                >
                  <FaRegCalendarAlt className="h-3.5 w-3.5" /> Calendar
                </button>
              </div>
              <Button leftIcon={<FaPlus />} variant="primary" onClick={newTrade}>
                Add Trade
              </Button>
            </>
          }
        />

        {viewMode === "calendar" ? (
          <>
            {calendarError && (
              <Alert variant="error" title="Error">
                {calendarError}
              </Alert>
            )}

            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <div>
                  <span className={colorMode === "light" ? "text-gray-500" : "text-gray-400"}>
                    Monthly P&amp;L:{" "}
                  </span>
                  <span
                    className={`font-semibold ${
                      calendarMonthlySummary.netPnl > 0
                        ? "text-green-500"
                        : calendarMonthlySummary.netPnl < 0
                        ? "text-red-500"
                        : ""
                    }`}
                  >
                    {calendarMonthlySummary.netPnl >= 0 ? "+" : "-"}$
                    {Math.abs(calendarMonthlySummary.netPnl).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className={colorMode === "light" ? "text-gray-500" : "text-gray-400"}>
                    Trades:{" "}
                  </span>
                  <span className="font-semibold">{calendarMonthlySummary.tradeCount}</span>
                </div>
                <p className={`text-xs ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                  Click a day to filter the trades table to that date.
                </p>
              </div>
            </Card>

            <Card className={`${cardBg} ${borderColor} border`}>
              <CalendarHeader
                monthDate={monthDate}
                onPrevMonth={() =>
                  setMonthDate((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)))
                }
                onNextMonth={() =>
                  setMonthDate((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)))
                }
                onToday={() => setMonthDate(startOfMonthUTC(new Date()))}
              />
              <div className="p-1 sm:p-2 mt-4">
                {isCalendarLoading ? (
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-lg min-h-[70px] sm:min-h-[90px] animate-pulse ${
                          colorMode === "light" ? "bg-zinc-100" : "bg-zinc-700/40"
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <CalendarGrid
                    monthDate={monthDate}
                    aggregatesByDate={calendarAggregatesByDate}
                    onDayClick={handleCalendarDayClick}
                  />
                )}
              </div>
            </Card>
          </>
        ) : (
        <>
        {/* Filters */}
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {filtersOpen ? "Hide" : "Show"}
                {filtersOpen ? (
                  <FaChevronUp className="h-3 w-3" />
                ) : (
                  <FaChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>

            {filtersOpen && (
              <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="All">All</option>
                  <option value="PENDING">PENDING</option>
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAK_EVEN">BREAK_EVEN</option>
                  <option value="CANCELED">CANCELED</option>
                </Select>
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
                  {exchanges.map((exchange) => (
                    <option key={exchange.id} value={exchange.id}>
                      {exchange.exchangeName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <Select
                  value={filters.position}
                  onChange={(e) =>
                    setFilters({ ...filters, position: e.target.value })
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

              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters({ ...filters, from: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters({ ...filters, to: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={handleApplyFilters}
                isLoading={isLoading}
                leftIcon={<FaSearch />}
              >
                Apply Filters
              </Button>
              <Button variant="secondary" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
              </>
            )}
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        {/* Trades Table */}
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Spinner size="lg" />
                <p className="mt-4">Loading trades...</p>
              </div>
            ) : trades.length === 0 ? (
              <EmptyState
                title="No trades found"
                message="No trades found matching your filters."
                action={
                  <Button
                    variant="primary"
                    leftIcon={<FaPlus />}
                    onClick={newTrade}
                  >
                    Add Your First Trade
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className={`min-w-full divide-y ${
                    colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
                  }`}>
                    <Thead className={colorMode === "light" ? "bg-zinc-50" : "bg-zinc-800"}>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Symbol</Th>
                        <Th>Exchange</Th>
                        <Th>Position</Th>
                        <Th>Status</Th>
                        <Th>Size</Th>
                        <Th>Result</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody className={`${cardBg} divide-y ${
                      colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
                    }`}>
                      {trades.map((trade) => (
                        <Tr
                          key={trade.id}
                          className={`${
                            colorMode === "light" ? "hover:bg-zinc-50" : "hover:bg-zinc-700"
                          } transition-colors cursor-pointer`}
                          onClick={() => router.push(`/trades/${trade.id}`)}
                        >
                          <Td>{formatDate(trade.date)}</Td>
                          <Td className="font-medium">{trade.symbol}</Td>
                          <Td>{trade.exchangeName}</Td>
                          <Td>
                            <Badge className={getPositionBadgeClass(trade.position)}>
                              {trade.position}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge className={getStatusBadgeClass(trade.status)}>
                              {formatStatusLabel(trade.status)}
                            </Badge>
                          </Td>
                          <Td>{trade.size.toLocaleString()}</Td>
                          <Td
                            className={`font-medium ${
                              trade.result >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {formatResult(trade.result)}
                          </Td>
                          <Td>
                            <Link
                              href={`/trades/${trade.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="ghost">
                                <FaEye />
                              </Button>
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <p className={`text-sm ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                      Page {page} of {totalPages} ({total} total trades)
                    </p>
                    <Select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(parseInt(e.target.value, 10))
                      }
                      className="w-auto"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      leftIcon={<FaArrowLeft />}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1 || isLoading}
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      rightIcon={<FaArrowRight />}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || isLoading}
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
        </>
        )}
      </div>
    </div>
  );
};

export default TradesClient;
