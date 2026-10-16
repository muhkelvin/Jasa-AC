"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Wrench,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  ExternalLink,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { WorkOrder } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";

interface PartItem {
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}

export default function TechnicianJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-zinc-500">
          Memuat pekerjaan...
        </div>
      }
    >
      <TechnicianJobDetailContent params={params} />
    </React.Suspense>
  );
}

function TechnicianJobDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const { currentUser } = useRole();
  const id = resolvedParams.id;

  const [job, setJob] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service report modal / form toggle
  const [showReportForm, setShowReportForm] = useState(false);

  // Form states
  const [diagnosis, setDiagnosis] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [parts, setParts] = useState<PartItem[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([
    "/demo/ac_before_1.jpg",
  ]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([
    "/demo/ac_after_1.jpg",
  ]);

  const loadJob = async () => {
    if (!id) return;
    setLoading(true);
    const data = await WorkOrderService.getWorkOrderById(id);
    setJob(data);
    if (data?.service_report) {
      setDiagnosis(data.service_report.diagnosis);
      setActionTaken(data.service_report.action_taken);
      setRecommendation(data.service_report.recommendation || "");
      if (data.service_report.parts) {
        setParts(
          data.service_report.parts.map((p) => ({
            item_name: p.item_name,
            quantity: p.quantity,
            unit: p.unit,
            unit_cost: p.unit_cost,
          }))
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Memuat detail pekerjaan...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Pekerjaan tidak ditemukan.
      </div>
    );
  }

  // Action: Start Working
  const handleStartWork = async () => {
    try {
      setSubmitting(true);
      await WorkOrderService.transitionStatus({
        workOrderId: job.id,
        nextStatus: "in_progress",
        actorId: currentUser.id,
        reason: `Teknisi ${currentUser.full_name} tiba di lokasi dan mulai bekerja`,
      });
      await loadJob();
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Request Parts
  const handleRequestParts = async () => {
    const reason = prompt(
      "Masukkan jenis sparepart atau material yang belum tersedia:"
    );
    if (!reason) return;
    try {
      setSubmitting(true);
      await WorkOrderService.transitionStatus({
        workOrderId: job.id,
        nextStatus: "waiting_parts",
        actorId: currentUser.id,
        reason: `Menunggu sparepart: ${reason}`,
      });
      await loadJob();
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Resume from Waiting Parts
  const handleResumeWork = async () => {
    try {
      setSubmitting(true);
      await WorkOrderService.transitionStatus({
        workOrderId: job.id,
        nextStatus: "in_progress",
        actorId: currentUser.id,
        reason: "Sparepart telah tersedia, teknisi melanjutkan pengerjaan",
      });
      await loadJob();
    } finally {
      setSubmitting(false);
    }
  };

  // Add Part Row
  const handleAddPart = () => {
    setParts([
      ...parts,
      { item_name: "", quantity: 1, unit: "pcs", unit_cost: 50000 },
    ]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (
    index: number,
    field: keyof PartItem,
    value: string | number
  ) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  // Submit Service Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError("Diagnosis teknisi wajib diisi.");
      return;
    }
    if (!actionTaken.trim()) {
      setError("Tindakan perbaikan wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await WorkOrderService.submitServiceReport({
        work_order_id: job.id,
        technician_id: currentUser.id,
        diagnosis,
        action_taken: actionTaken,
        recommendation: recommendation.trim() ? recommendation : undefined,
        before_photo_urls: beforePhotos,
        after_photo_urls: afterPhotos,
        parts: parts.filter((p) => p.item_name.trim().length > 0),
      });

      setShowReportForm(false);
      await loadJob();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim laporan";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    job.customer?.address || ""
  )}`;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-28">
      {/* Back button */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/my-jobs"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Daftar Tugas Saya
        </Link>
        <span className="font-mono text-xs font-bold text-zinc-500">
          {job.work_order_number}
        </span>
      </div>

      {/* Main Job Card */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={job.status} />
          <PriorityBadge priority={job.priority} />
        </div>

        <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {job.title}
        </h1>

        {/* AC Unit spec */}
        {job.ac_unit && (
          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{job.ac_unit.brand}</span>
              <CapacityChip capacity={job.ac_unit.capacity_pk} />
            </div>
            {job.ac_unit.model && (
              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Model: {job.ac_unit.model}
              </div>
            )}
            {job.ac_unit.location_detail && (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5">
                Posisi: {job.ac_unit.location_detail}
              </div>
            )}
          </div>
        )}

        {/* Problem description */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Keluhan Pelanggan:
          </div>
          <p className="text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded border border-zinc-100 dark:border-zinc-800 leading-relaxed">
            {job.problem_description}
          </p>
        </div>
      </div>

      {/* Customer Contact & Quick Actions Card */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Pelanggan & Lokasi
        </div>

        <div className="space-y-1">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {job.customer?.name}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {job.customer?.address}
          </div>
        </div>

        {/* Action Buttons: Call & Maps (Large 48px touch targets) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {job.customer?.phone && (
            <a
              href={`tel:${job.customer.phone}`}
              className="flex items-center justify-center gap-1.5 h-12 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
            >
              <Phone className="w-4 h-4" />
              Telepon
            </a>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition border border-zinc-200 dark:border-zinc-700"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            Buka Maps
          </a>
        </div>
      </div>

      {/* Service Report Form (Visible when in_progress or pending_review) */}
      {(showReportForm || job.status === "pending_review" || job.status === "completed") && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {job.status === "completed"
                ? "Laporan Servis Selesai"
                : "Form Laporan Servis Lapangan"}
            </h2>
            {job.status === "in_progress" && (
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Tutup
              </button>
            )}
          </div>

          {error && (
            <div className="p-2.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            {/* Step 1: Diagnosis */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                1. Diagnosis & Kerusakan yang Ditemukan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Evaporator kotor tersumbat lendir, kapasitor kompresor lemah 15uF..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={job.status !== "in_progress"}
                className="w-full p-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            {/* Step 2: Action Taken */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                2. Tindakan Perbaikan yang Dilakukan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Cuci evaporator dengan chemical, pasang running kapasitor baru, uji ampere 3.5A..."
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                disabled={job.status !== "in_progress"}
                className="w-full p-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            {/* Step 3: Recommendation */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                3. Rekomendasi untuk Pelanggan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Jadwalkan cuci rutin berikutnya pada November 2026."
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                disabled={job.status !== "in_progress"}
                className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Step 4: Parts Used */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  4. Material / Sparepart yang Digunakan
                </label>
                {job.status === "in_progress" && (
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Item
                  </button>
                )}
              </div>

              {parts.length === 0 ? (
                <div className="p-3 text-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px]">
                  Tidak ada sparepart tambahan yang dicatat
                </div>
              ) : (
                <div className="space-y-2">
                  {parts.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Nama barang / sparepart"
                          value={p.item_name}
                          onChange={(e) =>
                            handlePartChange(idx, "item_name", e.target.value)
                          }
                          disabled={job.status !== "in_progress"}
                          className="flex-1 p-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs"
                        />
                        {job.status === "in_progress" && (
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">
                            Jumlah
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) =>
                              handlePartChange(idx, "quantity", Number(e.target.value))
                            }
                            disabled={job.status !== "in_progress"}
                            className="w-full p-1 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">
                            Satuan
                          </label>
                          <input
                            type="text"
                            value={p.unit}
                            onChange={(e) =>
                              handlePartChange(idx, "unit", e.target.value)
                            }
                            disabled={job.status !== "in_progress"}
                            className="w-full p-1 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">
                            Harga (Rp)
                          </label>
                          <input
                            type="number"
                            step="5000"
                            value={p.unit_cost}
                            onChange={(e) =>
                              handlePartChange(idx, "unit_cost", Number(e.target.value))
                            }
                            disabled={job.status !== "in_progress"}
                            className="w-full p-1 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 5: Photos preview */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                5. Foto Pekerjaan (Sebelum & Sesudah)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center">
                  <Camera className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    Foto Sebelum
                  </span>
                  <div className="text-[10px] text-emerald-600 mt-1 font-medium">
                    ✓ 1 Foto Terlampir
                  </div>
                </div>

                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center">
                  <Camera className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    Foto Sesudah
                  </span>
                  <div className="text-[10px] text-emerald-600 mt-1 font-medium">
                    ✓ 1 Foto Terlampir
                  </div>
                </div>
              </div>
            </div>

            {job.status === "in_progress" && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Mengirim Laporan..." : "Kirim Laporan Servis ke Admin"}
              </button>
            )}
          </form>
        </div>
      )}

      {/* Sticky Bottom Operational Action Bar (PRD Section 9: >= 48px touch target) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-3 max-w-md mx-auto shadow-lg">
        {job.status === "assigned" && (
          <button
            onClick={handleStartWork}
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Play className="w-4 h-4 fill-white" />
            {submitting ? "Memproses..." : "Mulai Bekerja di Lokasi"}
          </button>
        )}

        {job.status === "in_progress" && !showReportForm && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRequestParts}
              disabled={submitting}
              className="h-12 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-semibold text-xs hover:bg-amber-100 transition flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Butuh Sparepart
            </button>

            <button
              onClick={() => setShowReportForm(true)}
              className="h-12 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Kirim Laporan Servis
            </button>
          </div>
        )}

        {job.status === "waiting_parts" && (
          <button
            onClick={handleResumeWork}
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Play className="w-4 h-4 fill-white" />
            Sparepart Siap - Lanjutkan Pekerjaan
          </button>
        )}

        {job.status === "pending_review" && (
          <div className="h-12 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-200 flex items-center justify-center text-xs font-semibold gap-2">
            <Clock className="w-4 h-4" />
            Laporan Terkirim • Menunggu Review Admin
          </div>
        )}

        {job.status === "completed" && (
          <div className="h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Pekerjaan Tuntas & Telah Disetujui
          </div>
        )}
      </div>
    </div>
  );
}
