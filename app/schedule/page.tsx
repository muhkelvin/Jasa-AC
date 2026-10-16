"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Clock,
  User,
  Plus,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder, Profile } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { PageHeader } from "@/components/ui/page-header";
import { formatTime, formatDateTime } from "@/lib/utils";

const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

export default function SchedulePage() {
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const techs = await WorkOrderService.getTechnicians();
      const orders = await WorkOrderService.getWorkOrders();
      setTechnicians(techs);
      setWorkOrders(orders);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Memuat papan jadwal dispatch teknisi...
      </div>
    );
  }

  // Filter unscheduled or unassigned jobs
  const unscheduledOrders = workOrders.filter(
    (wo) =>
      wo.status === "new" ||
      wo.status === "scheduled" ||
      !wo.assignments ||
      wo.assignments.length === 0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papan Jadwal & Dispatch Teknisi"
        description="Visualisasi alokasi waktu kerja lapangan per teknisi hari ini. Memudahkan admin mengantisipasi bentrok jadwal."
        actions={
          <Link
            href="/work-orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Order Baru
          </Link>
        }
      />

      {/* Main Timeline Lanes (1 Lane per Technician per PRD Section 9) */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Timeline Penugasan Hari Ini
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {technicians.map((tech) => {
            const techOrders = workOrders.filter((wo) =>
              wo.assignments?.some((a) => a.technician_id === tech.id)
            );

            return (
              <div key={tech.id} className="p-4 space-y-3">
                {/* Technician header lane */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center justify-center">
                      {tech.full_name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {tech.full_name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {tech.phone} • {techOrders.length} Pekerjaan Terjadwal
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                    Aktif Bertugas
                  </span>
                </div>

                {/* Technician Job Cards Timeline Horizontal Grid */}
                {techOrders.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-dashed border-zinc-200 dark:border-zinc-800">
                    Tidak ada jadwal pekerjaan untuk teknisi ini hari ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {techOrders.map((wo) => {
                      const isWorking = wo.status === "in_progress";
                      return (
                        <Link
                          key={wo.id}
                          href={`/work-orders/${wo.id}`}
                          className={`p-3 rounded border transition hover:border-zinc-400 dark:hover:border-zinc-600 block ${
                            isWorking
                              ? "border-sky-400 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-400/40"
                              : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {wo.work_order_number}
                            </span>
                            <StatusBadge status={wo.status} />
                          </div>

                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {wo.title}
                          </div>

                          <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {wo.customer?.name}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500">
                            <div className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>
                                {wo.scheduled_start
                                  ? formatTime(wo.scheduled_start)
                                  : "Fleksibel"}
                              </span>
                            </div>
                            <PriorityBadge priority={wo.priority} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled / Waiting Dispatch Pool */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Antrean Pekerjaan Belum Ditugaskan ({unscheduledOrders.length})
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            Perlu ditetapkan teknisi dan waktu kunjungan
          </span>
        </div>

        {unscheduledOrders.length === 0 ? (
          <div className="py-4 text-center text-xs text-zinc-400">
            Semua pekerjaan aktif telah memiliki teknisi penanggung jawab.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unscheduledOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {wo.work_order_number}
                  </span>
                  <StatusBadge status={wo.status} />
                </div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {wo.title}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Pelanggan: {wo.customer?.name}
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    href={`/work-orders/${wo.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tugaskan Sekarang <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
