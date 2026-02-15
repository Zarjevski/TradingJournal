"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaSearch, FaArrowLeft, FaArrowRight, FaEye } from "react-icons/fa";
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
import { useColorMode } from "@/context/ColorModeContext";
import useNewTradeForm from "@/hooks/useNewTradeForm";

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
}

const TradesClient: React.FC<TradesClientProps> = ({
  initialTrades,
  initialTotal,
  exchanges,
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

  const [filters, setFilters] = useState({
    status: "All",
    exchangeId: "All",
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

  const getStatusColor = (status: string): string => {
    const s = status.toUpperCase();
    if (s === "WIN") return "bg-green-500";
    if (s === "LOSS") return "bg-red-500";
    if (s === "PENDING") return "bg-yellow-500";
    if (s === "BREAK_EVEN") return colorMode === "light" ? "bg-blue-500" : "bg-purple-500";
    if (s === "CANCELED") return "bg-gray-500";
    return "bg-gray-500";
  };

  const getPositionColor = (position: string): string => {
    const p = position.toUpperCase();
    if (p === "LONG") return colorMode === "light" ? "bg-blue-500" : "bg-purple-500";
    if (p === "SHORT") return "bg-purple-500";
    return "bg-gray-500";
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatResult = (result: number): string => {
    return result >= 0 ? `+$${result.toLocaleString()}` : `-$${Math.abs(result).toLocaleString()}`;
  };

  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Trades</h1>
          <Button
            leftIcon={<FaPlus />}
            variant="primary"
            onClick={newTrade}
          >
            Add Trade
          </Button>
        </div>

        {/* Filters */}
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
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
                            colorMode === "light" ? "hover:bg-gray-50" : "hover:bg-gray-700"
                          } transition-colors cursor-pointer`}
                          onClick={() => router.push(`/trades/${trade.id}`)}
                        >
                          <Td>{formatDate(trade.date)}</Td>
                          <Td className="font-medium">{trade.symbol}</Td>
                          <Td>{trade.exchangeName}</Td>
                          <Td>
                            <Badge className={getPositionColor(trade.position)}>
                              {trade.position}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge className={getStatusColor(trade.status)}>
                              {trade.status.replace(/_/g, " ")}
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
      </div>
    </div>
  );
};

export default TradesClient;
