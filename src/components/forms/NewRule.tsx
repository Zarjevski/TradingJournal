import React, { useState } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import axios from "axios";
import FormHeader from "./FormHeader";
import { motion } from "framer-motion";
import { spring } from "@/utils/framerEffects";
import { useRouter } from "next/navigation";
import useResetModal from "@/hooks/useResetModal";

const NewRule = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = useResetModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("You can't send an empty request!");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await axios.post("/api/rules/new", { text: value.trim() });
      reset();
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgColor = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  return (
    <motion.form
      className={`border shadow-lg rounded-lg w-full max-w-md ${bgColor} ${borderColor}`}
      onSubmit={handleSubmit}
      initial={spring.initial}
      animate={spring.animate}
      transition={spring.transition}
    >
      <FormHeader title="Add rule" />
      <div className="flex flex-col p-6 space-y-4">
        <Input
          type="text"
          label="Rule Content"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="Enter your trading rule..."
          error={error}
        />
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={reset}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Add Rule
          </Button>
        </div>
      </div>
    </motion.form>
  );
};

export default NewRule;
