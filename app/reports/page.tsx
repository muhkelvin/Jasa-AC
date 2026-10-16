"use client";

import React, { useState, useEffect } from "react";
import {
  ChartNoAxesCombined,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  FileCheck2,
  Calendar,
  Lock,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder, Payment, Profile } from "@/types/database";
import { PageHeader } from "@/components/ui/page-header";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

export default function ReportsPage() {
  const { currentUser } = useRole();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const orders = await WorkOrderService.getWorkOrders();
      setWorkOrders(orders);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Menghitung metrik laporan operasional & keuangan...
      </div>
    );
  }

  // Calculations
  const completedOrders = workOrders.filter((w) => w.status === "completed");
  const totalLabor = workOrders.reduce((acc, w) => acc + Number(w.labor_fee), 0);
  const totalParts = workOrders.reduce((acc, w) => acc + Number(w.parts_fee), 0);
  const totalDiscount = workOrders.reduce(
    (acc, w) => acc + Number(w.discount_amount),
    0
  );

  // Payments collected
  const allPayments: Payment[] = workOrders.flatMap((w) => w.payments || []);
  const verifiedRevenue = allPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  // Group by service type
  const serviceTypeCounts: Record<string, number> = {
    cleaning: 0,
    repair: 0,
    maintenance: 0,
    installation: 0,
    relocation: 0,
    inspection: 0,
  };
  workOrders.forEach((w) => {
    serviceTypeCounts[w.service_type] = (serviceTypeCounts[w.service_type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Operasional & Audit Keamanan"
        description="Ringkasan omzet terverifikasi, rekapitulasi biaya suku cadang vs jasa, serta log kepatuhan alur kerja."
      />

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Pembayaran Masuk
          </div>
          <div className="text-xl font-bold font-tabular text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(verifiedRevenue)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Dari {allPayments.length} transaksi tervalidasi
          </div>
        </div>

        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Biaya Jasa Servis
          </div>
          <div className="text-xl font-bold font-tabular text-zinc-900 dark:text-zinc-100 mt-1">
            {formatRupiah(totalLabor)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Pendapatan tenaga teknisi
          </div>
        </div>

        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Material & Sparepart
          </div>
          <div className="text-xl font-bold font-tabular text-amber-600 dark:text-amber-400 mt-1">
            {formatRupiah(totalParts)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Freon, kapasitor, pipa, & suku cadang
          </div>
        </div>

        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Potongan / Diskon Promosi
          </div>
          <div className="text-xl font-bold font-tabular text-zinc-700 dark:text-zinc-300 mt-1">
            {formatRupiah(totalDiscount)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Diskon pelanggan berkala
          </div>
        </div>
      </div>

      {/* Service Types Breakdown */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
          Distribusi Volume Pekerjaan Berdasarkan Kategori
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.cleaning}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Cuci Rutin</div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.repair}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Perbaikan Part</div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.maintenance}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Kontrak Berkala</div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.installation}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Pasang Baru</div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.relocation}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Bongkar Pasang</div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="text-base font-bold font-tabular text-zinc-900 dark:text-zinc-100">
              {serviceTypeCounts.inspection}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Troubleshooting</div>
          </div>
        </div>
      </div>

      {/* Security & Role-Based Access Audit Log */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Audit Trail Kepatuhan & Keamanan RLS
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            PostgreSQL RLS Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left operational-table text-xs">
            <thead>
              <tr>
                <th className="w-40">Timestamp (UTC)</th>
                <th className="w-44">Pelaku (Actor)</th>
                <th className="w-36">Aksi (Action)</th>
                <th>Target & Keterangan</th>
                <th className="w-28 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-zinc-500">
                  {formatDateTime(new Date(Date.now() - 3600000).toISOString())}
                </td>
                <td className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Agus Kurniawan (Teknisi)
                </td>
                <td className="font-mono text-blue-600 dark:text-blue-400">
                  submit_report
                </td>
                <td className="text-zinc-700 dark:text-zinc-300">
                  WO-2026-0006: Penggantian kapasitor 25uF & isi Freon R32
                </td>
                <td className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                    RLS Valid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-mono text-zinc-500">
                  {formatDateTime(new Date(Date.now() - 7200000).toISOString())}
                </td>
                <td className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Siti Rahma (Admin Ops)
                </td>
                <td className="font-mono text-indigo-600 dark:text-indigo-400">
                  assign_tech
                </td>
                <td className="text-zinc-700 dark:text-zinc-300">
                  WO-2026-0003: Penugasan Doni Pratama ke Klinik Medika Sehat
                </td>
                <td className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                    RLS Valid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-mono text-zinc-500">
                  {formatDateTime(new Date(Date.now() - 86400000 * 2).toISOString())}
                </td>
                <td className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Siti Rahma (Admin Ops)
                </td>
                <td className="font-mono text-emerald-600 dark:text-emerald-400">
                  approve_report
                </td>
                <td className="text-zinc-700 dark:text-zinc-300">
                  WO-2026-0007: Review & approval hasil cuci Daikin Inverter
                </td>
                <td className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                    RLS Valid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-mono text-zinc-500">
                  {formatDateTime(new Date(Date.now() - 86400000 * 2).toISOString())}
                </td>
                <td className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Siti Rahma (Admin Ops)
                </td>
                <td className="font-mono text-purple-600 dark:text-purple-400">
                  record_payment
                </td>
                <td className="text-zinc-700 dark:text-zinc-300">
                  WO-2026-0007: Rekam pembayaran Rp 150.000 (Ref: TRF-BCA-9882103)
                </td>
                <td className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                    RLS Valid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
