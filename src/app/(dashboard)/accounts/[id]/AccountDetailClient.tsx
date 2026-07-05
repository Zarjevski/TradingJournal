"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FaArrowLeft,
  FaDollarSign,
  FaChartLine,
  FaTrophy,
  FaClock,
  FaTrash,
  FaSync,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Table, { Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import showNotification from "@/hooks/useShowNotification";
import { getStatusBadgeClass, getPositionBadgeClass, formatStatusLabel } from "@/lib/tradeStatus";
import { formatSimpleDate } from "@/lib/dateFormat";

interface RecentTrade {
  id: string;
  date: string;
  symbol: string;
  position: string;
  status: string;
  size: number;
  result: number;
}

interface AccountDetailClientProps {
  account: {
    id: string;
    exchangeName: string;
    balance: number;
    image: string;
    connectedAt: string | null;
    lastSyncedAt: string | null;
    hasApiCredentials: boolean;
  };
  stats: {
    totalTrades: number;
    openTradesCount: number;
    winRate: number | null;
    netPnl: number;
  };
  initialRecentTrades: RecentTrade[];
}

const formatResult = (result: number): string =>
  result >= 0 ? `+$${result.toLocaleString()}` : `-$${Math.abs(result).toLocaleString()}`;

const AccountDetailClient: React.FC<AccountDetailClientProps> = ({
  account,
  stats,
  initialRecentTrades,
}) => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { refetch } = useUserContext();

  const [balance, setBalance] = useState(account.balance);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(String(account.balance));
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [symbolsInput, setSymbolsInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    balanceUsdt: number | null;
    tradesImported: number;
    tradesSkipped: number;
  } | null>(null);

  const mutedText = colorMode === "light" ? "text-gray-600" : "text-gray-400";
  const borderColor = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";

  const handleSaveBalance = async () => {
    const parsed = parseFloat(balanceInput);
    if (isNaN(parsed)) {
      showNotification("Please enter a valid balance", "Error");
      return;
    }

    setIsSavingBalance(true);
    try {
      await axios.patch(`/api/exchanges/${account.id}`, { balance: parsed });
      setBalance(parsed);
      setIsEditingBalance(false);
      showNotification("Balance updated", "Success");
      await refetch();
    } catch (error: any) {
      showNotification(error.response?.data?.error || "Failed to update balance", "Error");
    } finally {
      setIsSavingBalance(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/exchanges/${account.id}`);
      showNotification("Account deleted", "Success");
      await refetch();
      router.push("/accounts");
    } catch (error: any) {
      showNotification(error.response?.data?.error || "Failed to delete account", "Error");
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setSyncError("Both API key and secret are required");
      return;
    }

    const symbols = symbolsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const response = await axios.post(`/api/exchanges/${account.id}/sync`, {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        ...(symbols.length > 0 && { symbols }),
      });
      setSyncResult(response.data);
      if (typeof response.data.balanceUsdt === "number") {
        setBalance(response.data.balanceUsdt);
      }
      showNotification("Binance sync complete", "Success");
      await refetch();
      router.refresh();
    } catch (error: any) {
      setSyncError(error.response?.data?.error || "Failed to connect to Binance");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <Link
          href="/accounts"
          className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:underline`}
        >
          <FaArrowLeft /> Back to all accounts
        </Link>

        <PageHeader
          title={account.exchangeName}
          subtitle={
            account.lastSyncedAt
              ? `Last synced ${new Date(account.lastSyncedAt).toLocaleString()}`
              : undefined
          }
          leading={
            <Image
              height={56}
              width={56}
              src={account.image}
              alt={account.exchangeName}
              className="rounded-lg"
            />
          }
          actions={
            <Button
              variant="secondary"
              leftIcon={<FaTrash />}
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:text-red-600"
            >
              Delete Account
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className={`app-surface ${borderColor} border`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs xs:text-sm font-medium ${mutedText}`}>Balance</p>
              <FaDollarSign className={colorMode === "light" ? "text-zinc-500" : "text-zinc-400"} />
            </div>
            {isEditingBalance ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  autoFocus
                  className={`w-full px-2 py-1 rounded-md border text-lg font-bold ${
                    colorMode === "light"
                      ? "bg-white border-zinc-300 text-gray-900"
                      : "bg-zinc-800 border-zinc-600 text-white"
                  }`}
                />
                <button
                  onClick={handleSaveBalance}
                  disabled={isSavingBalance}
                  aria-label="Save balance"
                  className="text-green-500 hover:text-green-600 p-1"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => {
                    setIsEditingBalance(false);
                    setBalanceInput(String(balance));
                  }}
                  aria-label="Cancel"
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl xs:text-2xl font-bold">${balance.toLocaleString()}</h2>
                <button
                  onClick={() => setIsEditingBalance(true)}
                  aria-label="Edit balance"
                  className={`${mutedText} hover:text-zinc-500`}
                >
                  <FaEdit className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </Card>

          <Card className={`app-surface ${borderColor} border`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs xs:text-sm font-medium ${mutedText}`}>Total Trades</p>
              <FaChartLine className={colorMode === "light" ? "text-zinc-500" : "text-zinc-400"} />
            </div>
            <h2 className="text-xl xs:text-2xl font-bold">{stats.totalTrades}</h2>
          </Card>

          <Card className={`app-surface ${borderColor} border`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs xs:text-sm font-medium ${mutedText}`}>Win Rate</p>
              <FaTrophy className={colorMode === "light" ? "text-zinc-500" : "text-zinc-400"} />
            </div>
            <h2 className="text-xl xs:text-2xl font-bold">
              {stats.winRate === null ? "—" : `${stats.winRate.toFixed(0)}%`}
            </h2>
          </Card>

          <Card className={`app-surface ${borderColor} border`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs xs:text-sm font-medium ${mutedText}`}>Net P&amp;L</p>
              <FaClock className={colorMode === "light" ? "text-zinc-500" : "text-zinc-400"} />
            </div>
            <h2
              className={`text-xl xs:text-2xl font-bold ${
                stats.netPnl > 0 ? "text-green-500" : stats.netPnl < 0 ? "text-red-500" : ""
              }`}
            >
              {formatResult(stats.netPnl)}
            </h2>
          </Card>
        </div>

        {/* Connect via Binance API */}
        <Card className={`app-surface ${borderColor} border`}>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <FaSync />
            {account.hasApiCredentials ? "Re-sync with Binance" : `Connect ${account.exchangeName} via API`}
          </h2>
          <p className={`text-sm mb-4 ${mutedText}`}>
            Paste a <strong>read-only</strong> Binance API key (no withdrawal permission, ideally
            IP-restricted) to pull in your account balance and trade history automatically. Only
            Binance is supported right now.
          </p>
          <div className="space-y-4 max-w-lg">
            <Input
              type="text"
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Binance API key"
            />
            <Input
              type="password"
              label="API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Binance API secret"
            />
            <Input
              type="text"
              label="Symbols to sync (optional)"
              value={symbolsInput}
              onChange={(e) => setSymbolsInput(e.target.value)}
              placeholder="e.g. BTC/USDT, ETH/USDT"
            />
            <p className={`text-xs ${mutedText}`}>
              Binance has no &quot;all trades&quot; endpoint, so trade history is only imported for the
              symbols you list here (comma-separated). Leave blank to just connect and refresh
              your balance.
            </p>
            {syncError && <p className="text-sm text-red-500">{syncError}</p>}
            {syncResult && (
              <p className="text-sm text-green-500">
                Connected. Balance: ${syncResult.balanceUsdt ?? "—"} · Imported{" "}
                {syncResult.tradesImported} new trade
                {syncResult.tradesImported === 1 ? "" : "s"}
                {syncResult.tradesSkipped > 0 &&
                  ` (${syncResult.tradesSkipped} already imported)`}
                .
              </p>
            )}
            <Button
              variant="secondary"
              disabled={isSyncing}
              onClick={handleSync}
              leftIcon={<FaSync />}
            >
              {isSyncing ? "Connecting..." : "Connect & Sync"}
            </Button>
          </div>
        </Card>

        {/* Recent trades */}
        <Card className={`app-surface ${borderColor} border`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <Link
              href={`/trades?exchangeId=${account.id}`}
              className={`text-sm ${colorMode === "light" ? "text-zinc-600" : "text-zinc-400"} hover:underline`}
            >
              View all in Trades
            </Link>
          </div>
          {initialRecentTrades.length === 0 ? (
            <EmptyState
              title="No trades yet"
              message="Trades logged against this account will show up here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Symbol</Th>
                    <Th>Position</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Result</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {initialRecentTrades.map((trade) => (
                    <Tr
                      key={trade.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/trades/${trade.id}`)}
                    >
                      <Td>{formatSimpleDate(trade.date)}</Td>
                      <Td className="font-medium">{trade.symbol}</Td>
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
                      <Td
                        className={`text-right font-medium ${
                          trade.result >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatResult(trade.result)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className={`p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] app-surface`}>
          <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
          <p className={`mb-6 ${mutedText}`}>
            Are you sure you want to delete <strong>{account.exchangeName}</strong>? This will
            permanently delete the account and all {stats.totalTrades} associated trade
            {stats.totalTrades === 1 ? "" : "s"}.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default AccountDetailClient;
