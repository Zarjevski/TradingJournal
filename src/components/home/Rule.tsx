import axios from "axios";
import React from "react";
import { IoPencil, IoTrashOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";

const Rule = ({
  id,
  title,
  number,
}: {
  id: string;
  title: string;
  number: number;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { colorMode } = useColorMode();
  const { refetch } = useUserContext();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      setIsDeleting(true);
      try {
        await axios.delete("/api/rules/delete", {
          data: { id },
        });
        await refetch();
      } catch (error) {
        console.error("Error deleting rule:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ scale: 1.02 }}
      className={`h-auto min-h-[3rem] w-full flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
        colorMode === "light"
          ? "hover:bg-gray-50 border border-gray-200"
          : "hover:bg-gray-700/50 border border-gray-700"
      } ${isDeleting ? "opacity-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h6 className="capitalize flex-1 text-sm">
        <span className={`mr-2 font-extrabold ${
          colorMode === "light" ? "text-blue-600" : "text-blue-400"
        }`}>
          #{number + 1}.
        </span>
        <span className={
          colorMode === "light" ? "text-gray-700" : "text-gray-300"
        }>{title}</span>
      </h6>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${
                colorMode === "light"
                  ? "hover:bg-blue-100 text-blue-600"
                  : "hover:bg-blue-900/30 text-blue-400"
              }`}
              title="Edit rule"
            >
              <IoPencil className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-2 rounded-lg transition-colors ${
                colorMode === "light"
                  ? "hover:bg-red-100 text-red-600"
                  : "hover:bg-red-900/30 text-red-400"
              }`}
              title="Delete rule"
            >
              <IoTrashOutline className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Rule;
