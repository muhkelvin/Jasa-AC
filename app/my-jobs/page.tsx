"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { formatDateTime, formatTime, formatDate } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

export default function MyJobsPage() {
  const { currentUser, switchRole } = useRole();
  const [jobs, setJobs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyJobs = async () => {
    setLoading(true);
    // If current role is technician, filter by currentUser.id; otherwise show Doni's jobs as demo default
    const techId =
      currentUser.role === "technician"
        ? currentUser.id
        : "33333333-3333-3333-3333-333333333333";

    const allJobs = await WorkOrderService.getWorkOrders({
      technicianId: techId,
    });
    setJobs(allJobs);
    setLoading(false);
  };

  useEffect(() => {
    loadMyJobs();
  }, [currentUser]);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            Portal Kerja Lapangan
          </span>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tugas Saya Hari Ini
          </h1>
        </div>

        {/* Quick technician switch if viewing from admin */}
        {currentUser.role !== "technician" && (
          <button
            onClick={() => switchRole("technician")}
            className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
          >
            Uji Mode Teknisi
          </button>
        )}
      </div>

      {/* Technician Profile Card */}
      <div className="p-3.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-800 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-zinc-400">Teknisi Bertugas:</div>
          <div className="text-sm font-semibold mt-0.5">
            {currentUser.role === "technician"
              ? currentUser.full_name
              : "Doni Pratama (Demo)"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-zinc-400">Total Tugas:</div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            {jobs.length} Pekerjaan
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-400">
          Memuat jadwal pekerjaan...
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-500 border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900">
          Belum ada order pekerjaan yang ditugaskan kepada Anda saat ini.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isWorking = job.status === "in_progress";
            return (
              <div
                key={job.id}
                className={`rounded-lg border p-4 transition shadow-xs ${
                  isWorking
                    ? "border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/50"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                }`}
              >
                {/* Header row: WO number & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {job.work_order_number}
                    </span>
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                {/* Job Title & Service */}
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {job.title}
                </div>

                {/* AC Unit spec chip */}
                {job.ac_unit && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {job.ac_unit.brand}
                    </span>
                    <CapacityChip capacity={job.ac_unit.capacity_pk} />
                    {job.ac_unit.location_detail && (
                      <span className="text-[11px] truncate">
                        • {job.ac_unit.location_detail}
                      </span>
                    )}
                  </div>
                )}

                {/* Customer & Address (Clickable for Phone & Maps) */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {job.customer?.name}
                    </div>
                    {job.customer?.phone && (
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 min-h-[36px] px-2 rounded bg-blue-50 dark:bg-blue-950/60"
                      >
                        <Phone className="w-3 h-3" />
                        Telepon
                      </a>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{job.customer?.address}</span>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>
                      {job.scheduled_start
                        ? formatDateTime(job.scheduled_start)
                        : "Fleksibel"}
                    </span>
                  </div>

                  <Link
                    href={`/my-jobs/${job.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 hover:underline min-h-[44px]"
                  >
                    Buka Pekerjaan <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
