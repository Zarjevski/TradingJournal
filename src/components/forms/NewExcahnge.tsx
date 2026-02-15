import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import Button from "../common/Button";
import FormHeader from "./FormHeader";
import Input from "../common/Input";
import { useColorMode } from "@/context/ColorModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useModalContext } from "@/context/ModalContext";
import { useUserContext } from "@/context/UserContext";
import { FaSearch, FaSpinner, FaCheckCircle } from "react-icons/fa";
import Skeleton from "../common/Skeleton";
import showNotification from "@/hooks/useShowNotification";

interface Exchange {
  id: string;
  name: string;
  image: string;
  trust_score?: number;
  trust_score_rank?: number;
  year_established?: number;
  country?: string;
}

const NewExcahnge = () => {
  const { colorMode } = useColorMode();
  const { setIsOpen } = useModalContext();
  const { refetch } = useUserContext();
  const [active, setActive] = useState<Exchange | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState("");

  const filteredExchanges = useMemo(() => {
    if (!searchQuery.trim()) return exchanges;
    const query = searchQuery.toLowerCase();
    return exchanges.filter(
      (exchange) =>
        exchange.name.toLowerCase().includes(query) ||
        exchange.country?.toLowerCase().includes(query)
    );
  }, [exchanges, searchQuery]);

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/exchanges?per_page=100"
      );
      setExchanges(response.data);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      showNotification("Failed to load exchanges", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!active) {
      showNotification("Please select an exchange", "Error");
      return;
    }

    if (balance && isNaN(parseFloat(balance))) {
      showNotification("Please enter a valid balance", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/exchanges/new", {
        exchange: active.name,
        image: active.image,
        balance: balance ? parseFloat(balance) : 0,
      });

      if (response.status === 201) {
        showNotification("Exchange added successfully", "Success");
        await refetch();
        setIsOpen(false);
        setActive(null);
        setBalance("");
        setSearchQuery("");
      }
    } catch (error: any) {
      console.error("Error creating exchange:", error);
      showNotification(
        error.response?.data?.error || "Failed to add exchange",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleSubmit}
      className={`w-full max-w-4xl max-h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col ${
        colorMode === "light"
          ? "bg-white text-gray-900"
          : "bg-gray-800 text-white"
      }`}
    >
      <FormHeader title="Add New Exchange" />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <FaSearch
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
              colorMode === "light" ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exchanges..."
            className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              colorMode === "light"
                ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                : "bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            } placeholder:${colorMode === "light" ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>

        {/* Balance Input */}
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 ${
              colorMode === "light"
                ? "bg-blue-50 border-blue-200"
                : "bg-blue-900/20 border-blue-700"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {active.image && (
                <Image
                  width={40}
                  height={40}
                  src={active.image}
                  alt={active.name}
                  className="rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{active.name}</h3>
                {active.country && (
                  <p className={`text-sm ${
                    colorMode === "light" ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {active.country}
                  </p>
                )}
              </div>
              <FaCheckCircle className="text-green-500 ml-auto" />
            </div>
            <Input
              type="number"
              label="Initial Balance (Optional)"
              name="balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Enter initial balance (e.g., 1000)"
            />
          </motion.div>
        )}

        {/* Exchanges Grid */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            {isLoading
              ? "Loading exchanges..."
              : `Available Exchanges (${filteredExchanges.length})`}
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} width="w-full" hieght="h-16" />
              ))}
            </div>
          ) : filteredExchanges.length === 0 ? (
            <div
              className={`text-center py-12 rounded-lg border ${
                colorMode === "light"
                  ? "bg-gray-50 border-gray-200"
                  : "bg-gray-700/50 border-gray-600"
              }`}
            >
              <p className={`text-lg ${
                colorMode === "light" ? "text-gray-600" : "text-gray-400"
              }`}>
                No exchanges found
              </p>
              <p className={`text-sm mt-2 ${
                colorMode === "light" ? "text-gray-500" : "text-gray-500"
              }`}>
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {filteredExchanges.map((exchange) => {
                  const isSelected = active?.id === exchange.id;
                  return (
                    <motion.div
                      key={exchange.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActive(exchange)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? colorMode === "light"
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                            : "bg-blue-900/30 border-blue-500 ring-2 ring-blue-700"
                          : colorMode === "light"
                          ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          : "bg-gray-700/50 border-gray-600 hover:border-gray-500 hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {exchange.image && (
                          <div className="relative">
                            <Image
                              width={48}
                              height={48}
                              src={exchange.image}
                              alt={exchange.name}
                              className="rounded-lg"
                            />
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                              >
                                <FaCheckCircle className="text-white text-xs" />
                              </motion.div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {exchange.name}
                          </h4>
                          {exchange.trust_score && (
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className={`h-1.5 rounded-full flex-1 ${
                                  colorMode === "light"
                                    ? "bg-gray-200"
                                    : "bg-gray-600"
                                }`}
                              >
                                <div
                                  className={`h-full rounded-full ${
                                    exchange.trust_score >= 8
                                      ? "bg-green-500"
                                      : exchange.trust_score >= 6
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${(exchange.trust_score / 10) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className={`text-xs ${
                                colorMode === "light"
                                  ? "text-gray-600"
                                  : "text-gray-400"
                              }`}>
                                {exchange.trust_score}/10
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`p-4 border-t flex justify-end gap-3 ${
          colorMode === "light" ? "border-gray-200" : "border-gray-700"
        }`}
      >
        <Button
          text="Cancel"
          onClick={() => {
            setIsOpen(false);
            setActive(null);
            setBalance("");
            setSearchQuery("");
          }}
          variant="secondary"
          type="button"
        />
        <Button
          text={isSubmitting ? "Adding..." : "Add Exchange"}
          type="submit"
          disabled={!active || isSubmitting}
          icon={isSubmitting ? FaSpinner : undefined}
        />
      </div>
    </motion.form>
  );
};

export default NewExcahnge;
