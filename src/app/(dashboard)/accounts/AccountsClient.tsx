"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaPlus, FaDollarSign } from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";
import useNewExcahngeForm from "@/hooks/useNewExchangeForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/common/Skeleton";

const AccountsClient = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const newAccount = useNewExcahngeForm();
  const { isLoading, user } = useUserContext();

  const mutedText = colorMode === "light" ? "text-gray-600" : "text-gray-400";
  const borderColor = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";

  const totalBalance =
    user?.exchanges?.reduce((sum, exchange) => sum + (exchange.balance || 0), 0) || 0;

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Accounts"
          subtitle="Manage your trading accounts and see how each one is performing"
          actions={
            <Button
              onClick={() => newAccount()}
              leftIcon={<FaPlus />}
              className="w-full xs:w-auto min-h-[44px] touch-manipulation"
            >
              Add Account
            </Button>
          }
        />

        {/* Total Balance */}
        <Card className={`app-surface ${borderColor} border`}>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                colorMode === "light" ? "bg-zinc-100" : "bg-zinc-700/30"
              }`}
            >
              <FaDollarSign
                className={`text-2xl ${colorMode === "light" ? "text-zinc-500" : "text-zinc-400"}`}
              />
            </div>
            <div>
              <p className={`text-sm ${mutedText}`}>Total Balance</p>
              <p className="text-3xl font-bold">${totalBalance.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Accounts grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton width="w-full" hieght="h-24" />
              <Skeleton width="w-full" hieght="h-24" />
              <Skeleton width="w-full" hieght="h-24" />
            </>
          ) : user?.exchanges && user.exchanges.length > 0 ? (
            user.exchanges.map((exchange) => (
              <motion.div
                key={exchange.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(`/accounts/${exchange.id}`)}
                className={`rounded-lg border p-4 cursor-pointer transition-all min-h-[80px] flex items-center touch-manipulation app-surface hover:border-zinc-400 dark:hover:border-zinc-600 ${borderColor}`}
              >
                <div className="flex items-center gap-4">
                  <Image
                    height={48}
                    width={48}
                    src={exchange.image}
                    alt={exchange.exchangeName}
                    className="rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exchange.exchangeName}</h3>
                    <p className={`text-sm ${mutedText}`}>
                      Balance: <span className="font-medium">${(exchange.balance || 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div
              className={`col-span-full text-center py-12 rounded-lg border app-surface ${borderColor}`}
            >
              <p className="text-lg mb-2">No accounts yet</p>
              <p className={`text-sm mb-4 ${mutedText}`}>
                Add your first account to start tracking trades
              </p>
              <Button onClick={() => newAccount()} leftIcon={<FaPlus />}>
                Add Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsClient;
