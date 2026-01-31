"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSidebarLinks from "../../hooks/useSidebarLinks";
import { motion, AnimatePresence } from "framer-motion";

const SidebarUL = ({
  colorMode,
  isOpen,
}: {
  colorMode: string;
  isOpen: boolean;
}) => {
  const pathname = usePathname();
  const links = useSidebarLinks();

  // Enhanced active state detection (includes nested routes)
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <ul className="w-full flex flex-col py-2 px-2">
      {links.map((link, index) => {
        const { icon: Icon, title } = link;
        const active = isActive(link.path);

        const linkContent = (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full mb-1"
          >
            <Link
              href={link.path}
              className={`
                relative p-3 w-full rounded-lg flex items-center cursor-pointer
                transition-all duration-200 group
                ${!isOpen ? "justify-center" : "px-4"}
                ${
                  active
                    ? colorMode === "light"
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "bg-purple-900/30 text-purple-400 shadow-sm"
                    : colorMode === "light"
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-300 hover:bg-gray-800"
                }
              `}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                    colorMode === "light" ? "bg-blue-600" : "bg-purple-500"
                  }`}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className={`
                  h-5 w-5 flex-shrink-0 transition-transform duration-200
                  ${active ? "scale-110" : "group-hover:scale-105"}
                  ${isOpen ? "mr-3" : ""}
                `}
              />

              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {title}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Hover tooltip when collapsed */}
              {!isOpen && (
                <div
                  className={`
                    absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200
                    z-50
                    ${
                      colorMode === "light"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900"
                    }
                  `}
                >
                  {title}
                  <div
                    className={`
                      absolute right-full top-1/2 -translate-y-1/2 border-4
                      ${
                        colorMode === "light"
                          ? "border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent"
                          : "border-r-gray-100 border-t-transparent border-b-transparent border-l-transparent"
                      }
                    `}
                  />
                </div>
              )}
            </Link>
          </motion.li>
        );

        return linkContent;
      })}
    </ul>
  );
};

export default SidebarUL;
