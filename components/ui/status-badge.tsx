import React from "react";
import { cn } from "@/lib/utils";
import { WorkOrderStatus } from "@/types/database";

interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; dotColor: string; textColor: string; bg: string }
> = {
  new: {
    label: "Baru",
    dotColor: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
  },
  scheduled: {
    label: "Terjadwal",
    dotColor: "bg-indigo-500",
    textColor: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900",
  },
  assigned: {
    label: "Ditugaskan",
    dotColor: "bg-purple-500",
    textColor: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900",
  },
  in_progress: {
    label: "Dikerjakan",
    dotColor: "bg-sky-500 animate-pulse",
    textColor: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900",
  },
  waiting_parts: {
    label: "Menunggu Sparepart",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
  },
  pending_review: {
    label: "Menunggu Review",
    dotColor: "bg-orange-500",
    textColor: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900",
  },
  completed: {
    label: "Selesai",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
  },
  cancelled: {
    label: "Dibatalkan",
    dotColor: "bg-zinc-400",
    textColor: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  },
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border",
        config.bg,
        config.textColor,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}
