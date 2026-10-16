"use client";

import React from "react";
import { UserCheck, ShieldCheck, Wrench, ChevronDown } from "lucide-react";
import { useRole } from "./role-context";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { currentUser, setCurrentUser, availableUsers } = useRole();

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-zinc-500 hidden sm:inline">
          Workspace:
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
          Servis AC Prima Sejuk
        </span>
      </div>

      {/* Role Switcher Demo Control */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="user-switch"
          className="text-[11px] font-medium text-zinc-500 hidden md:inline"
        >
          Simulasi Akun:
        </label>
        <div className="relative">
          <select
            id="user-switch"
            value={currentUser.id}
            onChange={(e) => {
              const selected = availableUsers.find(
                (u) => u.id === e.target.value
              );
              if (selected) setCurrentUser(selected);
            }}
            className="text-xs font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-7 cursor-pointer"
          >
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} [{user.role.toUpperCase()}]
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2 pointer-events-none text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
