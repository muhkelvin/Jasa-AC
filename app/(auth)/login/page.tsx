"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Wrench, UserCheck } from "lucide-react";
import { useRole } from "@/components/layout/role-context";
import { initialProfiles } from "@/lib/services/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useRole();
  const [email, setEmail] = useState("siti.admin@acservice.id");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = initialProfiles.find(
      (p) =>
        p.id === "22222222-2222-2222-2222-222222222222" ||
        (email.includes("owner") && p.role === "owner") ||
        (email.includes("doni") && p.id === "33333333-3333-3333-3333-333333333333") ||
        (email.includes("agus") && p.id === "44444444-4444-4444-4444-444444444444")
    );

    if (user) {
      setCurrentUser(user);
      if (user.role === "technician") {
        router.push("/my-jobs");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  const selectQuickAccount = (userId: string) => {
    const user = initialProfiles.find((p) => p.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === "technician") {
        router.push("/my-jobs");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold font-mono text-sm flex items-center justify-center mx-auto">
            AC
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Sistem Operasional Servis AC
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Masuk ke portal internal operasional bisnis servis & maintenance AC.
          </p>
        </div>

        {/* Login Form Box */}
        <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Alamat Email Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 pt-1"
            >
              <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Role Picker (PRD Section 4 & 10) */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
              Pilihan Akun Uji Coba Demo:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  selectQuickAccount("22222222-2222-2222-2222-222222222222")
                }
                className="p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-400 text-left"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Siti Rahma
                </div>
                <div className="text-[10px] text-blue-600 font-medium">
                  Admin Operasional
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectQuickAccount("33333333-3333-3333-3333-333333333333")
                }
                className="p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-400 text-left"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Doni Pratama
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  Teknisi Lapangan
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectQuickAccount("11111111-1111-1111-1111-111111111111")
                }
                className="p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-400 text-left"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Budi Santoso
                </div>
                <div className="text-[10px] text-purple-600 font-medium">
                  Owner Bisnis
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectQuickAccount("44444444-4444-4444-4444-444444444444")
                }
                className="p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-400 text-left"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Agus Kurniawan
                </div>
                <div className="text-[10px] text-amber-600 font-medium">
                  Teknisi Lapangan
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-400">
          Sesuai PRD v1.2: Akun internal dikelola langsung oleh administrator.
        </div>
      </div>
    </div>
  );
}
