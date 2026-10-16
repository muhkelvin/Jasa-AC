import React from "react";
import { cn } from "@/lib/utils";
import { PriorityLevel } from "@/types/database";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

const priorityConfig: Record<
  PriorityLevel,
  { label: string; dotColor: string; textColor: string; bg: string }
> = {
  low: {
    label: "Rendah",
    dotColor: "bg-slate-400",
    textColor: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
  },
  medium: {
    label: "Sedang",
    dotColor: "bg-blue-400",
    textColor: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
  },
  high: {
    label: "Tinggi",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
  },
  urgent: {
    label: "Mendesak",
    dotColor: "bg-rose-500 animate-ping",
    textColor: "text-rose-700 dark:text-rose-300 font-semibold",
    bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-900",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border",
        config.bg,
        config.textColor,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
