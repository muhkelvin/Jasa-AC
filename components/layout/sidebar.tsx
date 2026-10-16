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
  ChartNoAxesCombined,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "./role-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("owner" | "admin" | "technician")[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "admin"],
  },
  {
    label: "Pekerjaan",
    href: "/work-orders",
    icon: ClipboardList,
    roles: ["owner", "admin"],
  },
  {
    label: "Jadwal & Dispatch",
    href: "/schedule",
    icon: CalendarClock,
    roles: ["owner", "admin"],
  },
  {
    label: "Pelanggan & Unit",
    href: "/customers",
    icon: Users,
    roles: ["owner", "admin"],
  },
  {
    label: "Pekerjaan Saya",
    href: "/my-jobs",
    icon: ClipboardList,
    roles: ["technician"],
  },
  {
    label: "Laporan & Audit",
    href: "/reports",
    icon: ChartNoAxesCombined,
    roles: ["owner", "admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useRole();

  const allowedNav = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-7 h-7 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 text-xs font-bold font-mono">
          AC
        </div>
        <div>
          <div className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sistem Operasional AC
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            v1.2 MVP · Dispatch
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider">
          {currentUser.role === "technician" ? "Menu Teknisi" : "Operasional"}
        </div>
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0 stroke-[1.75]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
              {currentUser.full_name}
            </div>
            <div className="text-[10px] text-zinc-400 capitalize font-mono">
              Role: {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
