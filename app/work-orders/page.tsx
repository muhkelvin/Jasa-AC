"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder, WorkOrderStatus } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { PageHeader } from "@/components/ui/page-header";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

export default function WorkOrdersPage() {
  const { currentUser } = useRole();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const loadOrders = async () => {
    setLoading(true);
    const data = await WorkOrderService.getWorkOrders({
      status: statusFilter !== "all" ? (statusFilter as WorkOrderStatus) : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      search: search.trim() ? search.trim() : undefined,
    });
    setWorkOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Daftar Pekerjaan & Dispatch"
        description="Kelola seluruh siklus work order: mulai dari pencatatan, penugasan teknisi, hingga verifikasi laporan."
        actions={
          currentUser.role !== "technician" && (
            <Link
              href="/work-orders/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Pekerjaan Baru
            </Link>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-white dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nomor WO, nama pelanggan, keluhan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="new">Baru</option>
            <option value="scheduled">Terjadwal</option>
            <option value="assigned">Ditugaskan</option>
            <option value="in_progress">Dikerjakan</option>
            <option value="waiting_parts">Menunggu Sparepart</option>
            <option value="pending_review">Menunggu Review</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Prioritas</option>
            <option value="urgent">Mendesak</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>
        </div>
      </div>

      {/* Main Table View (Desktop) & Card View (Mobile) */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Memuat data pekerjaan...
          </div>
        ) : workOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            Tidak ada pekerjaan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <>
            {/* Desktop Operational Compact Table (PRD: row height ~40px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse operational-table">
                <thead>
                  <tr>
                    <th className="w-28">No. WO</th>
                    <th>Pelanggan</th>
                    <th>Keluhan & Tipe Servis</th>
                    <th className="w-24">Prioritas</th>
                    <th className="w-36">Status</th>
                    <th className="w-36">Teknisi Bertugas</th>
                    <th className="w-28">Estimasi Biaya</th>
                    <th className="w-20 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => {
                    const tech = wo.assignments?.[0]?.technician;
                    return (
                      <tr
                        key={wo.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="font-mono font-medium text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <Link
                            href={`/work-orders/${wo.id}`}
                            className="hover:underline"
                          >
                            {wo.work_order_number}
                          </Link>
                        </td>
                        <td className="max-w-[180px]">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate text-xs">
                            {wo.customer?.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {wo.customer?.phone}
                          </div>
                        </td>
                        <td className="max-w-[240px]">
                          <div className="text-zinc-800 dark:text-zinc-200 font-medium truncate text-xs">
                            {wo.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
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
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {tech.full_name}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">
                              Belum ditugaskan
                            </span>
                          )}
                        </td>
                        <td className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                          {formatRupiah(wo.total_amount || 0)}
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/work-orders/${wo.id}`}
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                          >
                            Buka
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
              {workOrders.map((wo) => {
                const tech = wo.assignments?.[0]?.technician;
                return (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="block p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {wo.work_order_number}
                      </span>
                      <StatusBadge status={wo.status} />
                    </div>

                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {wo.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {wo.customer?.name} • {wo.customer?.address}
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={wo.priority} />
                        {wo.ac_unit && (
                          <CapacityChip capacity={wo.ac_unit.capacity_pk} />
                        )}
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {tech ? tech.full_name : "Belum ada teknisi"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
