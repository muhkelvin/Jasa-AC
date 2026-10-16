"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Check,
  X,
  FileText,
  DollarSign,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderStatusHistory,
  Profile,
} from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatRupiah,
  formatDateTime,
  formatDate,
  formatTime,
} from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

// 6 Main Stages defined in PRD Section 5 & 9
const WORKFLOW_STAGES: { status: WorkOrderStatus; label: string }[] = [
  { status: "new", label: "Baru" },
  { status: "scheduled", label: "Terjadwal" },
  { status: "assigned", label: "Ditugaskan" },
  { status: "in_progress", label: "Dikerjakan" },
  { status: "pending_review", label: "Menunggu Review" },
  { status: "completed", label: "Selesai" },
];

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-zinc-500">
          Memuat detail work order...
        </div>
      }
    >
      <WorkOrderDetailContent params={params} />
    </React.Suspense>
  );
}

function WorkOrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const { currentUser } = useRole();
  const id = resolvedParams.id;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [history, setHistory] = useState<WorkOrderStatusHistory[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment dialog state
  const [assignTechId, setAssignTechId] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Review dialog state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewApprove, setReviewApprove] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("BCA Transfer");
  const [payRef, setPayRef] = useState("");

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const wo = await WorkOrderService.getWorkOrderById(id);
    const hist = await WorkOrderService.getStatusHistory(id);
    const techs = await WorkOrderService.getTechnicians();
    setWorkOrder(wo);
    setHistory(hist);
    setTechnicians(techs);
    if (wo) setPayAmount(wo.total_amount || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Memuat detail work order {id}...
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="text-sm font-semibold text-zinc-900">
          Work order tidak ditemukan
        </div>
        <Link
          href="/work-orders"
          className="text-xs text-blue-600 hover:underline"
        >
          Kembali ke daftar pekerjaan
        </Link>
      </div>
    );
  }

  // Handle direct status transition
  const handleTransition = async (nextStatus: WorkOrderStatus, reason?: string) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await WorkOrderService.transitionStatus({
        workOrderId: workOrder.id,
        nextStatus,
        actorId: currentUser.id,
        reason: reason || `Perubahan status oleh ${currentUser.full_name}`,
      });
      if (!res.success) {
        setError(res.error || "Gagal mengubah status");
      } else {
        await loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle technician assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTechId) return;
    try {
      setActionLoading(true);
      await WorkOrderService.assignTechnician({
        workOrderId: workOrder.id,
        technicianId: assignTechId,
        assignedBy: currentUser.id,
      });
      setShowAssignModal(false);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Admin Review & Approval
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await WorkOrderService.reviewServiceReport({
        workOrderId: workOrder.id,
        reviewerId: currentUser.id,
        approved: reviewApprove,
        reviewNotes: reviewNotes.trim() ? reviewNotes : undefined,
      });
      setShowReviewModal(false);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Record Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await WorkOrderService.recordPayment({
        work_order_id: workOrder.id,
        amount: Number(payAmount),
        payment_method: payMethod,
        recorded_by: currentUser.id,
        reference: payRef.trim() ? payRef : undefined,
      });
      setShowPaymentModal(false);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (s) => s.status === workOrder.status
  );
  const isCancelled = workOrder.status === "cancelled";
  const isWaitingParts = workOrder.status === "waiting_parts";
  const assignedTech = workOrder.assignments?.[0]?.technician;
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "owner";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Pekerjaan
        </Link>
        <span className="font-mono text-xs font-semibold text-zinc-500">
          ID: {workOrder.id}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
              {workOrder.work_order_number}
            </span>
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-600 dark:text-zinc-300">
              {workOrder.service_type}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-1.5">
            {workOrder.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Dibuat: {formatDateTime(workOrder.created_at)}
          </p>
        </div>

        {/* Action Controls for Admin/Owner based on State Machine */}
        {isPrivileged && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {workOrder.status === "new" && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Tugaskan Teknisi
              </button>
            )}

            {workOrder.status === "scheduled" && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Pilih Teknisi
              </button>
            )}

            {workOrder.status === "assigned" && (
              <button
                onClick={() => handleTransition("in_progress", "Mulai pengerjaan oleh admin")}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition"
              >
                Tandai Mulai Kerja
              </button>
            )}

            {workOrder.status === "in_progress" && (
              <>
                <button
                  onClick={() =>
                    handleTransition("waiting_parts", "Material suku cadang belum tersedia di gudang")
                  }
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
                >
                  Tandai Menunggu Sparepart
                </button>
                <Link
                  href={`/my-jobs/${workOrder.id}`}
                  className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Form Laporan Servis
                </Link>
              </>
            )}

            {workOrder.status === "waiting_parts" && (
              <button
                onClick={() =>
                  handleTransition("in_progress", "Sparepart telah tiba, pekerjaan dilanjutkan")
                }
                disabled={actionLoading}
                className="px-3 py-1.5 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition"
              >
                Lanjutkan Pekerjaan
              </button>
            )}

            {workOrder.status === "pending_review" && (
              <button
                onClick={() => {
                  setReviewApprove(true);
                  setShowReviewModal(true);
                }}
                className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Review & Setujui Laporan
              </button>
            )}

            {workOrder.status !== "completed" && workOrder.status !== "cancelled" && (
              <button
                onClick={() => {
                  const reason = prompt("Masukkan alasan pembatalan pekerjaan ini:");
                  if (reason) handleTransition("cancelled", reason);
                }}
                disabled={actionLoading}
                className="px-2.5 py-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
              >
                Batalkan
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6-Stage Timeline Tracker (Package tracking style per PRD Section 9) */}
      <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Status Alur Kerja Operasional
        </div>

        {isCancelled ? (
          <div className="p-3 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <X className="w-4 h-4 text-rose-500" />
            <span>
              Pekerjaan ini telah <strong>Dibatalkan</strong>. Alasan:{" "}
              {workOrder.cancel_reason || "Tidak ada alasan spesifik"}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Step indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isPassed =
                  currentStageIndex >= index || workOrder.status === "completed";
                const isCurrent = workOrder.status === stage.status;

                return (
                  <div
                    key={stage.status}
                    className={`p-2.5 rounded border transition-all ${
                      isCurrent
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80 shadow-xs"
                        : isPassed
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? "text-zinc-900 dark:text-zinc-100 font-bold"
                            : isPassed
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isWaitingParts && (
              <div className="mt-2.5 p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Saat ini dalam status cabang khusus: <strong>Menunggu Sparepart</strong>. Pekerjaan akan dilanjutkan setelah material tiba.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Details & Service Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Customer & Problem Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer & Unit AC card */}
          <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Pelanggan & Lokasi Servis
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-zinc-500 text-[11px]">Nama Pelanggan:</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {workOrder.customer?.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-zinc-700 dark:text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <a
                    href={`tel:${workOrder.customer?.phone}`}
                    className="hover:underline font-mono"
                  >
                    {workOrder.customer?.phone}
                  </a>
                </div>
              </div>

              <div>
                <div className="text-zinc-500 text-[11px]">Alamat & Akses:</div>
                <div className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5">
                  {workOrder.customer?.address}
                </div>
                {workOrder.customer?.notes && (
                  <div className="text-[11px] text-zinc-500 italic mt-1">
                    Catatan: {workOrder.customer.notes}
                  </div>
                )}
              </div>
            </div>

            {/* AC Unit Detail */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-zinc-500 text-[11px] mb-1">Unit AC yang Dikerjakan:</div>
              {workOrder.ac_unit ? (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {workOrder.ac_unit.brand}
                  </span>
                  <CapacityChip capacity={workOrder.ac_unit.capacity_pk} />
                  {workOrder.ac_unit.model && (
                    <span className="text-zinc-500 font-mono text-[11px]">
                      ({workOrder.ac_unit.model})
                    </span>
                  )}
                  {workOrder.ac_unit.location_detail && (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      • {workOrder.ac_unit.location_detail}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 italic">
                  Unit AC belum terdaftar khusus untuk order ini
                </div>
              )}
            </div>

            {/* Problem Description */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-zinc-500 text-[11px] mb-1">Keluhan / Deskripsi Masalah:</div>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded border border-zinc-100 dark:border-zinc-800">
                {workOrder.problem_description}
              </p>
            </div>
          </div>

          {/* Service Report Section (Crucial PRD v1.2 requirement) */}
          <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Laporan Servis Teknisi
                </span>
              </div>
              {workOrder.service_report && (
                <span className="text-[11px] text-zinc-400">
                  Diajukan: {formatDateTime(workOrder.service_report.submitted_at)}
                </span>
              )}
            </div>

            {workOrder.service_report ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-zinc-500 text-[11px] font-medium">
                    Diagnosis Teknisi:
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 mt-0.5 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded">
                    {workOrder.service_report.diagnosis}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-500 text-[11px] font-medium">
                    Tindakan yang Dilakukan:
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 mt-0.5 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded">
                    {workOrder.service_report.action_taken}
                  </div>
                </div>

                {workOrder.service_report.recommendation && (
                  <div>
                    <div className="text-zinc-500 text-[11px] font-medium">
                      Rekomendasi Servis Lanjutan:
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {workOrder.service_report.recommendation}
                    </div>
                  </div>
                )}

                {/* Parts Used */}
                {workOrder.service_report.parts &&
                  workOrder.service_report.parts.length > 0 && (
                    <div>
                      <div className="text-zinc-500 text-[11px] font-medium mb-1.5">
                        Material & Sparepart yang Digunakan:
                      </div>
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-[11px] text-zinc-500">
                            <tr>
                              <th className="p-2">Item Sparepart</th>
                              <th className="p-2 w-20">Qty</th>
                              <th className="p-2 w-28 text-right">Harga</th>
                              <th className="p-2 w-28 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {workOrder.service_report.parts.map((p) => (
                              <tr key={p.id}>
                                <td className="p-2 font-medium">{p.item_name}</td>
                                <td className="p-2">
                                  {p.quantity} {p.unit}
                                </td>
                                <td className="p-2 text-right font-mono">
                                  {formatRupiah(p.unit_cost)}
                                </td>
                                <td className="p-2 text-right font-mono font-medium">
                                  {formatRupiah((p.subtotal || p.quantity * p.unit_cost))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Photos */}
                {(workOrder.service_report.before_photo_urls.length > 0 ||
                  workOrder.service_report.after_photo_urls.length > 0) && (
                  <div>
                    <div className="text-zinc-500 text-[11px] font-medium mb-1.5">
                      Dokumentasi Foto Pekerjaan:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                        <div className="text-[11px] font-medium text-zinc-500 mb-1">
                          Foto Sebelum Servis
                        </div>
                        <div className="h-28 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center text-zinc-400 text-[11px]">
                          [Foto Evaporator / Kondensor Awal]
                        </div>
                      </div>
                      <div className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                        <div className="text-[11px] font-medium text-zinc-500 mb-1">
                          Foto Sesudah Servis
                        </div>
                        <div className="h-28 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center text-zinc-400 text-[11px]">
                          [Foto Hasil Kerja & Tekanan Freon]
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review status note */}
                {workOrder.service_report.reviewed_at && (
                  <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                    <div className="font-semibold text-xs">
                      Laporan Disetujui pada {formatDateTime(workOrder.service_report.reviewed_at)}
                    </div>
                    {workOrder.service_report.review_notes && (
                      <div className="text-[11px] mt-0.5">
                        Catatan Admin: {workOrder.service_report.review_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                Teknisi belum mengunggah laporan servis untuk order ini.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dispatch, Financials, & Status Timeline */}
        <div className="space-y-5">
          {/* Dispatch & Technician card */}
          <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
              <span>Penugasan & Jadwal</span>
              {isPrivileged && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                >
                  Ubah
                </button>
              )}
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-zinc-500 text-[11px]">Teknisi Utama:</span>
                {assignedTech ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                      {assignedTech.full_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {assignedTech.full_name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {assignedTech.phone}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 font-medium mt-1">
                    Belum ada teknisi ditugaskan
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 text-[11px]">Jadwal Kunjungan:</span>
                <div className="text-zinc-900 dark:text-zinc-100 font-medium mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {workOrder.scheduled_start
                      ? formatDateTime(workOrder.scheduled_start)
                      : "Belum dijadwalkan"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financials & Billing */}
          <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
              <span>Rincian Biaya</span>
              {isPrivileged && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                >
                  + Catat Bayar
                </button>
              )}
            </div>

            <div className="text-xs space-y-1.5 font-tabular">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Jasa Teknisi:</span>
                <span>{formatRupiah(workOrder.labor_fee)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Material / Sparepart:</span>
                <span>{formatRupiah(workOrder.parts_fee)}</span>
              </div>
              {workOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Diskon:</span>
                  <span>- {formatRupiah(workOrder.discount_amount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                <span>Total Tagihan:</span>
                <span>{formatRupiah(workOrder.total_amount || 0)}</span>
              </div>
            </div>

            {/* Payments List */}
            {workOrder.payments && workOrder.payments.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="text-[11px] font-semibold text-zinc-500 mb-1">
                  Riwayat Pembayaran:
                </div>
                {workOrder.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-0.5"
                  >
                    <div className="flex justify-between font-medium">
                      <span>{p.payment_method}</span>
                      <span className="text-emerald-600 font-mono">
                        {formatRupiah(p.amount)}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {formatDateTime(p.paid_at)} {p.reference && `• Ref: ${p.reference}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit History Timeline (Immutable audit trail per PRD Section 6) */}
          <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Jejak Audit Status
            </div>

            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={h.id} className="text-xs relative pl-4 border-l border-zinc-200 dark:border-zinc-800 pb-2 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 absolute -left-1 top-1" />
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Status: <span className="capitalize">{h.new_status.replace("_", " ")}</span>
                  </div>
                  {h.reason && (
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {h.reason}
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {formatDateTime(h.created_at)} • {h.changer?.full_name || "Sistem"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tugaskan Teknisi Lapangan
            </h3>
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Teknisi
                </label>
                <select
                  value={assignTechId}
                  onChange={(e) => setAssignTechId(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !assignTechId}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Verifikasi & Review Laporan Servis
            </h3>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Keputusan Verifikasi
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={reviewApprove}
                      onChange={() => setReviewApprove(true)}
                    />
                    <span className="text-emerald-700 font-semibold">
                      Setujui Laporan (Selesai)
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={!reviewApprove}
                      onChange={() => setReviewApprove(false)}
                    />
                    <span className="text-amber-700 font-semibold">
                      Tolak / Perlu Revisi
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Admin / Reviewer
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Contoh: Pekerjaan rapi, hasil uji arus kelistrikan normal."
                  className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800"
                >
                  Kirim Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Catat Pembayaran Servis
            </h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-xs font-mono p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="BCA Transfer">BCA Transfer</option>
                  <option value="Mandiri Transfer">Mandiri Transfer</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                  <option value="Tunai">Tunai (Cash di Tempat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor Referensi Transaksi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-998124"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || payAmount <= 0}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
