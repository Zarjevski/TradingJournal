"use client";

import React, { useState } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import Button from "@/components/common/Button";
import Image from "next/image";
import useNewExcahngeForm from "@/hooks/useNewExchangeForm";
import Skeleton from "@/components/common/Skeleton";
import { useUserContext } from "@/context/UserContext";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTrash, FaPlus, FaDollarSign } from "react-icons/fa";
import ConfirmModal from "@/components/common/ConfirmModal";
import showNotification from "@/hooks/useShowNotification";

const Page = () => {
  const { colorMode } = useColorMode();
  const newExcahnge = useNewExcahngeForm();
  const { isLoading, user, refetch } = useUserContext();
  const [active, setActive] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteExchange = async () => {
    if (!active) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete("/api/exchanges/delete", {
        data: { exchangeId: active },
      });
      if (response.status === 200) {
        showNotification("Exchange deleted successfully", "Success");
        setActive("");
        setShowDeleteModal(false);
        await refetch();
      }
    } catch (error: any) {
      console.error("Error deleting exchange:", error);
      showNotification(
        error.response?.data?.error || "Failed to delete exchange",
        "Error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const totalBalance = user?.exchanges?.reduce(
    (sum, exchange) => sum + (exchange.balance || 0),
    0
  ) || 0;

  const selectedExchange = user?.exchanges?.find((ex) => ex.id === active);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full w-full p-6 overflow-y-auto app-bg"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Exchanges</h1>
        <p className={`text-sm ${
          colorMode === "light" ? "text-gray-600" : "text-gray-400"
        }`}>
          Manage your trading exchanges and account balances
        </p>
      </div>

      {/* Total Balance Card */}
      <div
        className={`mb-6 rounded-lg border shadow-lg backdrop-blur-sm p-6 app-surface ${
          colorMode === "light"
            ? "border-blue-200"
            : "border-purple-700"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            colorMode === "light" ? "bg-blue-500/20" : "bg-purple-700/30"
          }`}>
            <FaDollarSign className={`text-2xl ${
              colorMode === "light" ? "text-blue-500" : "text-purple-400"
            }`} />
          </div>
          <div>
            <p className={`text-sm ${
              colorMode === "light" ? "text-gray-600" : "text-gray-400"
            }`}>
              Total Balance
            </p>
            <p className={`text-3xl font-bold ${
              colorMode === "light" ? "text-gray-900" : "text-white"
            }`}>
              ${totalBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Exchanges Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">My Exchanges</h2>
          <Button
            text="Add Exchange"
            onClick={() => newExcahnge()}
            icon={FaPlus}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton width="w-full" hieght="h-24" />
              <Skeleton width="w-full" hieght="h-24" />
              <Skeleton width="w-full" hieght="h-24" />
            </>
          ) : user?.exchanges && user.exchanges.length > 0 ? (
            user.exchanges.map((exchange: any) => (
              <motion.div
                key={exchange.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActive(exchange.id)}
                className={`rounded-lg border shadow-lg backdrop-blur-sm p-4 cursor-pointer transition-all ${
                  active === exchange.id
                    ? colorMode === "light"
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-blue-500 bg-blue-900/30 ring-2 ring-blue-700"
                    : colorMode === "light"
                    ? "bg-white/95 border-gray-200 hover:border-gray-300"
                    : "bg-gray-800/95 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      height={48}
                      width={48}
                      src={exchange.image}
                      alt={exchange.exchangeName}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exchange.exchangeName}</h3>
                    <p className={`text-sm ${
                      colorMode === "light" ? "text-gray-600" : "text-gray-400"
                    }`}>
                      Balance: <span className="font-medium">${(exchange.balance || 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div
              className={`col-span-full text-center py-12 rounded-lg border ${
                colorMode === "light"
                  ? "bg-gray-50 border-gray-200"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              <p className={`text-lg mb-2 ${
                colorMode === "light" ? "text-gray-700" : "text-gray-300"
              }`}>
                No exchanges yet
              </p>
              <p className={`text-sm mb-4 ${
                colorMode === "light" ? "text-gray-500" : "text-gray-400"
              }`}>
                Add your first exchange to start tracking trades
              </p>
              <Button text="Add Exchange" onClick={() => newExcahnge()} />
            </div>
          )}
        </div>
      </div>

      {/* Delete Section */}
      {selectedExchange && (
        <div
          className={`rounded-lg border shadow-lg backdrop-blur-sm p-6 ${
            colorMode === "light"
              ? "bg-red-50 border-red-200"
              : "bg-red-900/20 border-red-800"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">Delete Exchange</h2>
          <p className={`text-sm mb-4 ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            You are about to delete <strong>{selectedExchange.exchangeName}</strong>.
            This action cannot be undone and will also delete all associated trades.
          </p>
          <Button
            text="Delete Exchange"
            onClick={() => setShowDeleteModal(true)}
            icon={FaTrash}
            className="bg-red-500 hover:bg-red-600 text-white"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className={`p-6 ${
          colorMode === "light" ? "bg-white" : "bg-gray-800"
        }`}>
          <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
          <p className={`mb-6 ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Are you sure you want to delete <strong>{selectedExchange?.exchangeName}</strong>?
            This will permanently delete the exchange and all associated trades.
          </p>
          <div className="flex gap-4 justify-end">
            <Button
              text="Cancel"
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-500 hover:bg-gray-600"
            />
            <Button
              text={isDeleting ? "Deleting..." : "Delete"}
              onClick={deleteExchange}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            />
          </div>
        </div>
      </ConfirmModal>
    </motion.div>
  );
};

export default Page;
