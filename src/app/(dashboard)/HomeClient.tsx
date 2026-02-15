"use client";

import React from "react";
import {
  FaDollarSign,
  FaClock,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus,
  FaExchangeAlt,
  FaFileAlt,
  FaCalendarWeek,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getHomeData } from "@/lib/home";
import FearAndGreed from "@/components/home/FearAndGreed";
import TopCoins from "@/components/home/TopCoins";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Table, { Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { useColorMode } from "@/context/ColorModeContext";
import useNewRuleForm from "@/hooks/useNewRuleForm";

interface HomeClientProps {
  homeData: NonNullable<Awaited<ReturnType<typeof getHomeData>>>;
}

const HomeClient: React.FC<HomeClientProps> = ({ homeData }) => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const newRule = useNewRuleForm();

  const getStatusColor = (status: string): string => {
    const s = status.toUpperCase();
    if (s === "WIN") return "bg-green-500";
    if (s === "LOSS") return "bg-red-500";
    if (s === "PENDING") return "bg-yellow-500";
    if (s === "BREAK_EVEN") return colorMode === "light" ? "bg-blue-500" : "bg-purple-500";
    if (s === "CANCELED") return "bg-gray-500";
    return "bg-gray-500";
  };

  const getMarketRegime = (): string => {
    // Placeholder: In a real implementation, this would be based on market data
    return "Risk-On";
  };

  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const subTextColor = colorMode === "light" ? "text-gray-600" : "text-gray-400";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  
  // Improved layout - better spacing and organization

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Command Center</h1>
          <p className={`text-sm ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            Current state, market context, and immediate actions
          </p>
        </div>

        {/* Top Section - 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    colorMode === "light" ? "bg-blue-50" : "bg-purple-900/30"
                  } ${colorMode === "light" ? "text-blue-500" : "text-purple-400"}`}
                >
                  <FaDollarSign className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-medium ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    Total Balance
                  </p>
                  <h2 className="text-2xl font-bold">
                    ${homeData.totalBalance.toLocaleString("en-US")}
                  </h2>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    colorMode === "light" ? "bg-yellow-50" : "bg-yellow-900"
                  } text-yellow-500`}
                >
                  <FaClock className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-medium ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    Open Trades
                  </p>
                  <h2 className="text-2xl font-bold">{homeData.openTradesCount}</h2>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    colorMode === "light" ? "bg-purple-50" : "bg-purple-900"
                  } text-purple-500`}
                >
                  <FaChartLine className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-medium ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    Trades Today
                  </p>
                  <h2 className="text-2xl font-bold">{homeData.todayTradesCount}</h2>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    homeData.todayPnL >= 0
                      ? colorMode === "light"
                        ? "bg-green-50"
                        : "bg-green-900"
                      : colorMode === "light"
                      ? "bg-red-50"
                      : "bg-red-900"
                  } ${homeData.todayPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {homeData.todayPnL >= 0 ? (
                    <FaArrowUp className="h-6 w-6" />
                  ) : (
                    <FaArrowDown className="h-6 w-6" />
                  )}
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-medium ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    P&L Today
                  </p>
                  <h2
                    className={`text-2xl font-bold ${
                      homeData.todayPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${homeData.todayPnL.toLocaleString("en-US")}
                  </h2>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content - Reorganized Layout */}
        <div className="space-y-6">
          {/* Top Row - Rules and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discipline & Focus */}
            <Card className={`${cardBg} ${borderColor} border`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Discipline & Focus</h2>
                <Button variant="primary" size="sm" leftIcon={<FaPlus />} onClick={newRule}>
                  Add rule
                </Button>
              </div>
              <div className="space-y-4">
                {/* Rule of the Day */}
                <div
                  className={`p-4 rounded-md border ${borderColor} ${
                    colorMode === "light" ? "bg-gray-50" : "bg-gray-700"
                  }`}
                >
                  <p className={`text-xs font-bold uppercase mb-2 ${subTextColor}`}>
                    Rule of the Day
                  </p>
                  <p className={`italic text-base ${textColor}`}>
                    {homeData.ruleOfTheDay || (
                      <button
                        onClick={newRule}
                        className={`${colorMode === "light" ? "text-blue-500" : "text-purple-400"} hover:underline`}
                      >
                        Add your first trading rule
                      </button>
                    )}
                  </p>
                </div>

                {/* Discipline Status */}
                {homeData.disciplineWarnings.length > 0 ? (
                  <div className="space-y-2">
                    {homeData.disciplineWarnings.map((warning, index) => (
                      <Alert key={index} variant="warning" title="Warning">
                        <p className="text-sm">{warning}</p>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert variant="success" title="All Clear">
                    <p className="text-sm">All systems normal</p>
                  </Alert>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className={`${cardBg} ${borderColor} border`}>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  leftIcon={<FaPlus />}
                  variant="primary"
                  onClick={() => router.push("/trades")}
                  className="w-full"
                >
                  Add Trade
                </Button>
                <Button
                  leftIcon={<FaFileAlt />}
                  variant="secondary"
                  onClick={() => router.push("/trades")}
                  className="w-full"
                >
                  Review Trades
                </Button>
                <Button
                  leftIcon={<FaCalendarWeek />}
                  variant="secondary"
                  onClick={() => router.push("/analytics")}
                  className="w-full"
                >
                  View Analytics
                </Button>
                <Button
                  leftIcon={<FaExchangeAlt />}
                  variant="secondary"
                  onClick={() => router.push("/settings/exchanges")}
                  className="w-full"
                >
                  Manage Exchanges
                </Button>
              </div>
            </Card>
          </div>

          {/* Bottom Row - Market Context and Recent Trades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Context */}
            <Card className={`${cardBg} ${borderColor} border`}>
              <h2 className="text-xl font-semibold mb-4">Market Context</h2>
              <div className="space-y-4">
                <div>
                  <FearAndGreed colorMode={colorMode} />
                </div>
                <div>
                  <TopCoins />
                </div>
                <div className={`border-t ${borderColor}`}></div>
                <div
                  className={`flex justify-between items-center p-3 rounded-md ${
                    colorMode === "light" ? "bg-gray-50" : "bg-gray-700"
                  }`}
                >
                  <p className={`font-semibold text-sm ${textColor}`}>Market Regime:</p>
                  <Badge variant="info" size="sm">
                    {getMarketRegime()}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Recent Trades */}
            <Card className={`${cardBg} ${borderColor} border`}>
              <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
              {homeData.recentTrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className={`min-w-full divide-y ${
                    colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
                  }`}>
                    <Thead className={`${colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}`}>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Symbol</Th>
                        <Th>Exchange</Th>
                        <Th>Position</Th>
                        <Th>Status</Th>
                        <Th className="text-right">Result</Th>
                      </Tr>
                    </Thead>
                    <Tbody className={`${cardBg} divide-y ${
                      colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
                    }`}>
                      {homeData.recentTrades.map((trade) => (
                        <Tr
                          key={trade.id}
                          className={`${
                            colorMode === "light" ? "hover:bg-gray-50" : "hover:bg-gray-700"
                          } transition-colors cursor-pointer`}
                          onClick={() => router.push(`/trades/${trade.id}`)}
                        >
                          <Td>
                            {new Date(trade.date).toLocaleDateString("en-US")}
                          </Td>
                          <Td>
                        <Link
                          href={`/trades/${trade.id}`}
                          className={`${colorMode === "light" ? "text-blue-500" : "text-purple-400"} font-semibold hover:underline`}
                        >
                          {trade.symbol}
                        </Link>
                          </Td>
                          <Td>{trade.exchangeName}</Td>
                          <Td>{trade.position}</Td>
                          <Td>
                            <Badge className={getStatusColor(trade.status)}>
                              {trade.status.replace(/_/g, " ")}
                            </Badge>
                          </Td>
                          <Td
                            className={`text-right font-semibold ${
                              trade.result >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            ${trade.result.toLocaleString("en-US")}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 italic">
                  No trades yet. Start by adding your first trade!
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeClient;
