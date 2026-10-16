import React from "react";
import { cn, formatPK } from "@/lib/utils";

interface CapacityChipProps {
  capacity: number;
  className?: string;
}

export function CapacityChip({ capacity, className }: CapacityChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
        className
      )}
    >
      {formatPK(capacity)}
    </span>
  );
}
