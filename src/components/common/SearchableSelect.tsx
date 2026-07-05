import React, { useState, useRef, useEffect } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaChevronDown } from "react-icons/fa";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Search...",
}) => {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      <label
        className={`block mb-2 text-sm font-semibold capitalize ${
          colorMode === "light" ? "text-gray-700" : "text-gray-300"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
            colorMode === "light"
              ? "bg-white border-zinc-300 text-gray-900 hover:border-zinc-400"
              : "bg-zinc-800 border-zinc-600 text-white hover:border-zinc-500"
          }`}
        >
          <span className={selectedOption ? "" : "text-gray-400"}>
            {selectedOption
              ? `${selectedOption.value} - ${selectedOption.label}`
              : placeholder}
          </span>
          <FaChevronDown
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute z-50 w-full mt-2 rounded-lg border-2 shadow-xl ${
                colorMode === "light"
                  ? "bg-white border-zinc-200"
                  : "bg-zinc-800 border-zinc-700"
              }`}
            >
              {/* Search Input */}
              <div className={`p-2 border-b ${colorMode === "light" ? "border-zinc-200" : "border-zinc-600"}`}>
                <div className="relative">
                  <FaSearch
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      colorMode === "light" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all ${
                      colorMode === "light"
                        ? "bg-zinc-50 border-zinc-300 text-gray-900 focus:border-zinc-500"
                        : "bg-zinc-700 border-zinc-600 text-white focus:border-zinc-400"
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div
                    className={`p-4 text-center ${
                      colorMode === "light" ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    No results found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full px-4 py-2 text-left transition-colors ${
                        value === option.value
                          ? colorMode === "light"
                            ? "bg-zinc-100 text-zinc-900"
                            : "bg-zinc-700/50 text-zinc-200"
                          : colorMode === "light"
                          ? "hover:bg-zinc-50 text-gray-900"
                          : "hover:bg-zinc-700 text-gray-300"
                      }`}
                    >
                      <div className="font-medium">{option.value}</div>
                      <div
                        className={`text-xs ${
                          colorMode === "light" ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {option.label}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchableSelect;
