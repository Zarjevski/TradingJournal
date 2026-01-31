import React from "react";
import Rule from "./Rule";
import useNewRuleForm from "@/hooks/useNewRuleForm";
import Button from "@/components/ui/Button";
import Skeleton from "../common/Skeleton";
import { useUserContext } from "@/context/UserContext";
import { useColorMode } from "@/context/ColorModeContext";
import { motion } from "framer-motion";

const RulesList = () => {
  const data: any = useUserContext();
  const newRule = useNewRuleForm();
  const { colorMode } = useColorMode();
  
  const loading = data.isLoading;
  const rules = data.user?.rules || [];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`${
        colorMode === "light"
          ? "text-gray-900 bg-white/95"
          : "bg-gray-800/95 text-white"
      }
      rounded-lg col-start-4 row-span-2 border shadow-lg backdrop-blur-sm ${
        colorMode === "light" ? "border-gray-200" : "border-gray-700"
      }`}
    >
      <header className={`w-full flex justify-between items-center border-b py-3 px-6 bg-gradient-to-r ${
        colorMode === "light"
          ? "from-gray-50 to-white border-gray-200"
          : "from-gray-800 to-gray-700 border-gray-700"
      }`}>
        <h1 className="font-bold text-xl">My Rules</h1>
        <Button onClick={() => newRule()} variant="primary" size="sm">
          + New
        </Button>
      </header>
      <ul className="w-full h-auto text-sm p-4 space-y-2 overflow-y-auto max-h-[calc(92vh-120px)]">
        {loading
          ? [1, 2, 3, 4].map((skeleton, index) => {
              return <Skeleton key={index} width={"w-full"} hieght={"h-8"}/>
            })
          : rules?.map(
              (rule: { content: string; id: string }, index: number) => {
                return (
                  <Rule
                    key={rule.id}
                    id={rule.id}
                    title={rule.content}
                    number={index}
                  />
                );
              }
            )}
      </ul>
    </motion.div>
  );
};

export default RulesList;
