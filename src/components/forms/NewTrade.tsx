import React, { useState } from "react";
import ChooseExchange from "../trades/ChooseExchange";
import FormHeader from "./FormHeader";
import TradeDetails from "../trades/TradeDetails";
import axios from "axios";
import { useColorMode } from "@/context/ColorModeContext";
import { useModalContext } from "@/context/ModalContext";
import { useUserContext } from "@/context/UserContext";
import { spring } from "@/utils/framerEffects";
import { motion as m } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import Button from "../common/Button";
import showNotification from "@/hooks/useShowNotification";

const NewTrade = () => {
  const { colorMode } = useColorMode();
  const { setIsOpen } = useModalContext();
  const { refetch } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [exchange, setExchange] = useState({ id: "", title: "" });
  const [formData, setFormData] = useState({
    symbol: "",
    position: "",
    size: "",
    margin: "",
    date: "",
    status: "",
    reason: "",
    result: "",
    imageURL: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchange.id) {
      showNotification("Please select an exchange", "Error");
      return;
    }

    // Validate required fields
    if (!formData.symbol || !formData.position || !formData.date || !formData.status || !formData.size || !formData.reason) {
      showNotification("Please fill in all required fields", "Error");
      return;
    }

    setIsLoading(true);
    try {
      // For losses: store result as negative so account balance is deducted
      let resultValue = formData.result.trim() === "" ? "0" : formData.result;
      if (formData.status?.toLowerCase() === "loss" && resultValue) {
        const r = parseInt(resultValue, 10);
        if (!isNaN(r) && r > 0) resultValue = String(-r);
      }

      const response = await axios.post("/api/trades/new", {
        exchangeId: exchange.id,
        exchangeName: exchange.title,
        formData: {
          ...formData,
          result: resultValue,
          exchangeName: exchange.title,
        },
      });

      if (response.status === 201) {
        showNotification("Trade created successfully", "Success");
        await refetch();
        setIsOpen(false);
        // Reset form
        setExchange({ id: "", title: "" });
        setFormData({
          symbol: "",
          position: "",
          size: "",
          margin: "",
          date: "",
          status: "",
          reason: "",
          result: "",
          imageURL: "",
        });
      }
    } catch (error: any) {
      console.error("Error creating trade:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to create trade";
      showNotification(errorMessage, "Error");
      
      // Log full error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("Full error details:", {
          status: error.response?.status,
          data: error.response?.data,
          request: {
            exchangeId: exchange.id,
            formData,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <m.form
      className={`${
        colorMode === "light"
          ? "bg-white/95 border-gray-200"
          : "bg-gray-800/95 border-gray-700"
      } w-full max-w-4xl max-h-[90vh] shadow-2xl rounded-xl border backdrop-blur-sm overflow-hidden flex flex-col`}
      initial={spring.initial}
      animate={spring.animate}
      transition={spring.transition}
      onSubmit={handleSubmit}
    >
      {!exchange.id ? (
        <ChooseExchange colorMode={colorMode} setExchange={setExchange} />
      ) : (
        <>
          <FormHeader title={"Add New Trade"} />
          <div className="flex-1 overflow-y-auto">
            <TradeDetails setFormData={setFormData} formData={formData} />
          </div>
          <div className={`p-4 border-t flex justify-end gap-3 ${
            colorMode === "light" ? "border-gray-200" : "border-gray-700"
          }`}>
            <Button
              text="Cancel"
              onClick={() => {
                setIsOpen(false);
                setExchange({ id: "", title: "" });
                setFormData({
                  symbol: "",
                  position: "",
                  size: "",
                  margin: "",
                  date: "",
                  status: "",
                  reason: "",
                  result: "",
                  imageURL: "",
                });
              }}
              variant="secondary"
              type="button"
            />
            <Button
              text={isLoading ? "Creating..." : "Create Trade"}
              type="submit"
              disabled={isLoading}
              icon={isLoading ? FaSpinner : undefined}
            />
          </div>
        </>
      )}
    </m.form>
  );
};

export default NewTrade;
