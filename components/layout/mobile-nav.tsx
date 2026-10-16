"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "./role-context";

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useRole();

  if (currentUser.role === "technician") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around h-14 px-2">
        <Link
          href="/my-jobs"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[11px] font-medium transition-colors",
            pathname.startsWith("/my-jobs")
              ? "text-zinc-900 dark:text-zinc-50 font-bold"
              : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          <ClipboardList className="w-5 h-5 mb-0.5 stroke-[1.75]" />
          Pekerjaan
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[11px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-zinc-900 dark:text-zinc-50 font-bold"
              : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          <Wrench className="w-5 h-5 mb-0.5 stroke-[1.75]" />
          Info Teknisi
        </Link>
      </nav>
    );
  }

  // Admin / Owner Mobile Nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around h-14 px-1">
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[10px] font-medium transition-colors",
          pathname === "/dashboard"
            ? "text-zinc-900 dark:text-zinc-50 font-bold"
            : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <LayoutDashboard className="w-4 h-4 mb-0.5" />
        Dashboard
      </Link>
      <Link
        href="/work-orders"
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[10px] font-medium transition-colors",
          pathname.startsWith("/work-orders")
            ? "text-zinc-900 dark:text-zinc-50 font-bold"
            : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <ClipboardList className="w-4 h-4 mb-0.5" />
        Pekerjaan
      </Link>
      <Link
        href="/schedule"
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[10px] font-medium transition-colors",
          pathname.startsWith("/schedule")
            ? "text-zinc-900 dark:text-zinc-50 font-bold"
            : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <CalendarClock className="w-4 h-4 mb-0.5" />
        Jadwal
      </Link>
      <Link
        href="/customers"
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-[10px] font-medium transition-colors",
          pathname.startsWith("/customers")
            ? "text-zinc-900 dark:text-zinc-50 font-bold"
            : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <Users className="w-4 h-4 mb-0.5" />
        Pelanggan
      </Link>
    </nav>
  );
}
