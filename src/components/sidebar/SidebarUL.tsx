"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSidebarLinks from "../../hooks/useSidebarLinks";
import { motion, AnimatePresence } from "framer-motion";
import { IoLockClosedOutline } from "react-icons/io5";

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
        const { icon: Icon, title, locked } = link;
        const active = !locked && isActive(link.path);

        const itemClassName = `
                relative p-3 w-full rounded-lg flex items-center
                transition-all duration-200 group
                ${!isOpen ? "justify-center" : "px-4"}
                ${
                  locked
                    ? colorMode === "light"
                      ? "text-zinc-400 cursor-not-allowed"
                      : "text-zinc-600 cursor-not-allowed"
                    : active
                    ? colorMode === "light"
                      ? "bg-zinc-100 text-zinc-900 shadow-sm cursor-pointer"
                      : "bg-zinc-800 text-zinc-100 shadow-sm cursor-pointer"
                    : colorMode === "light"
                    ? "text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    : "text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                }
              `;

        const innerContent = (
          <>
            {/* Active indicator */}
            {active && (
              <motion.div
                layoutId="activeIndicator"
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                  colorMode === "light" ? "bg-zinc-900" : "bg-zinc-100"
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
                  className="font-medium whitespace-nowrap flex items-center gap-1.5"
                >
                  {title}
                  {locked && <IoLockClosedOutline className="h-3.5 w-3.5 flex-shrink-0" />}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Hover tooltip when collapsed */}
            {!isOpen && (
              <div
                className={`
                    absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200
                    z-50 flex items-center gap-1.5
                    ${
                      colorMode === "light"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-900"
                    }
                  `}
              >
                {title}
                {locked && <IoLockClosedOutline className="h-3 w-3 flex-shrink-0" />}
                <div
                  className={`
                      absolute right-full top-1/2 -translate-y-1/2 border-4
                      ${
                        colorMode === "light"
                          ? "border-r-zinc-900 border-t-transparent border-b-transparent border-l-transparent"
                          : "border-r-zinc-100 border-t-transparent border-b-transparent border-l-transparent"
                      }
                    `}
                />
              </div>
            )}
          </>
        );

        return (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full mb-1"
          >
            {locked ? (
              <div
                role="button"
                aria-disabled="true"
                title={`${title} — coming soon`}
                className={itemClassName}
              >
                {innerContent}
              </div>
            ) : (
              <Link href={link.path} className={itemClassName}>
                {innerContent}
              </Link>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
};

export default SidebarUL;
