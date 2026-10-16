"use client";

import React, { Suspense } from "react";
import { RoleProvider } from "./role-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Suspense fallback={<aside className="hidden md:flex w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
          <Suspense fallback={<div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />}>
            <Topbar />
          </Suspense>
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Memuat konten...</div>}>
              {children}
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </RoleProvider>
  );
}
