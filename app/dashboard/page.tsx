"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Plus,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { PageHeader } from "@/components/ui/page-header";
import { formatRupiah, formatDateTime, formatTime } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

export default function DashboardPage() {
  const { currentUser } = useRole();
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<{
    totalOrders: number;
    pendingReviewCount: number;
    inProgressCount: number;
    unassignedCount: number;
    waitingPartsCount: number;
    completedCount: number;
    totalRevenue: number;
    attentionList: WorkOrder[];
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await WorkOrderService.getDashboardKPI();
    setKpi(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !kpi) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  // If logged in as technician, show helpful shortcut banner
  const isTech = currentUser.role === "technician";

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pusat Operasional"
        description={
          kpi.pendingReviewCount > 0
            ? `${kpi.pendingReviewCount} pekerjaan butuh persetujuan review dan ${kpi.unassignedCount} belum ditugaskan.`
            : "Semua antrean operasional saat ini dalam penanganan normal."
        }
        actions={
          <div className="flex items-center gap-2">
            {!isTech && (
              <Link
                href="/work-orders/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Work Order
              </Link>
            )}
            {isTech && (
              <Link
                href="/my-jobs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                Buka Pekerjaan Saya
              </Link>
            )}
          </div>
        }
      />

      {/* Technician Banner notification if in technician mode */}
      {isTech && (
        <div className="p-3.5 rounded border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Wrench className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              Anda login sebagai <strong>{currentUser.full_name}</strong>. Akses langsung tugas lapangan Anda di menu <strong>Pekerjaan Saya</strong>.
            </span>
          </div>
          <Link
            href="/my-jobs"
            className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline shrink-0 ml-2"
          >
            Buka <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Compact Operational Context Counters (Not flashy KPI cards, per PRD Section 9) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Menunggu Review
          </div>
          <div className="text-xl font-bold font-tabular text-orange-600 dark:text-orange-400 mt-1">
            {kpi.pendingReviewCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Laporan teknisi masuk</div>
        </div>

        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Sedang Dikerjakan
          </div>
          <div className="text-xl font-bold font-tabular text-sky-600 dark:text-sky-400 mt-1">
            {kpi.inProgressCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Teknisi di lokasi</div>
        </div>

        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Menunggu Sparepart
          </div>
          <div className="text-xl font-bold font-tabular text-amber-600 dark:text-amber-400 mt-1">
            {kpi.waitingPartsCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Tertahan pengadaan</div>
        </div>

        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Belum Ditugaskan
          </div>
          <div className="text-xl font-bold font-tabular text-zinc-900 dark:text-zinc-100 mt-1">
            {kpi.unassignedCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Perlu dispatch</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Omzet Terverifikasi
          </div>
          <div className="text-lg font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(kpi.totalRevenue)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {kpi.completedCount} pekerjaan tuntas
          </div>
        </div>
      </div>

      {/* CORE OPERATIONAL LIST: "Daftar Perlu Perhatian" (Actionable dispatch list) */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Antrean Tindakan Dispatch & Review ({kpi.attentionList.length})
            </h2>
          </div>
          <Link
            href="/work-orders"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium"
          >
            Lihat semua pekerjaan <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {kpi.attentionList.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Tidak ada pekerjaan yang membutuhkan perhatian mendesak saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse operational-table">
              <thead>
                <tr>
                  <th className="w-28">No. WO</th>
                  <th>Pelanggan & Lokasi</th>
                  <th>Keluhan & Unit</th>
                  <th className="w-24">Prioritas</th>
                  <th className="w-36">Status</th>
                  <th className="w-32">Teknisi</th>
                  <th className="w-24 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kpi.attentionList.map((wo) => {
                  const tech = wo.assignments?.[0]?.technician;
                  return (
                    <tr
                      key={wo.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="font-mono font-medium text-xs text-zinc-900 dark:text-zinc-200 whitespace-nowrap">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="hover:underline text-blue-600 dark:text-blue-400"
                        >
                          {wo.work_order_number}
                        </Link>
                      </td>
                      <td className="max-w-[200px]">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {wo.customer?.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {wo.customer?.address}
                        </div>
                      </td>
                      <td className="max-w-[240px]">
                        <div className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                          {wo.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{wo.service_type}</span>
                          {wo.ac_unit && (
                            <>
                              <span>•</span>
                              <span>{wo.ac_unit.brand}</span>
                              <CapacityChip capacity={wo.ac_unit.capacity_pk} />
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={wo.priority} />
                      </td>
                      <td>
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="text-xs text-zinc-600 dark:text-zinc-400">
                        {tech ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {tech.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            Belum ditugaskan
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                        >
                          Kelola
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Dispatch Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href="/schedule"
          className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Papan Jadwal Hari Ini
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Lihat timeline lane teknisi dan alokasi jam kerja
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </Link>

        <Link
          href="/customers"
          className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Database Pelanggan & Unit AC
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Riwayat unit, kapasitas PK, dan lokasi pemasangan
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </Link>

        <Link
          href="/reports"
          className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Laporan Operasional & Audit
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Catatan biaya, pendapatan servis, dan log keamanan
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </Link>
      </div>
    </div>
  );
}
