import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface SkeletonProps {
  width: string;
  hieght: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ hieght, width }) => {
  const { colorMode } = useColorMode();
  return (
    <div
      className={`${hieght} ${width} ${
        colorMode === "light" ? "bg-zinc-200" : "bg-zinc-700"
      } my-2 animate-pulse`}
    >
    </div>
  );
};

export default Skeleton;
