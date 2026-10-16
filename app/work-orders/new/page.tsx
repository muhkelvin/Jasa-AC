"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Wrench, Calendar, User } from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { Customer, AcUnit, Profile } from "@/types/database";
import { PageHeader } from "@/components/ui/page-header";
import { useRole } from "@/components/layout/role-context";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { currentUser } = useRole();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [acUnits, setAcUnits] = useState<AcUnit[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [acUnitId, setAcUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [serviceType, setServiceType] = useState<
    "cleaning" | "repair" | "maintenance" | "installation" | "relocation" | "inspection"
  >("cleaning");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState("");
  const [laborFee, setLaborFee] = useState<number>(100000);
  const [partsFee, setPartsFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    async function init() {
      const custs = await WorkOrderService.getCustomers();
      const techs = await WorkOrderService.getTechnicians();
      setCustomers(custs);
      setTechnicians(techs);
      if (custs.length > 0) {
        setCustomerId(custs[0].id);
        const units = await WorkOrderService.getCustomerUnits(custs[0].id);
        setAcUnits(units);
        if (units.length > 0) setAcUnitId(units[0].id);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleCustomerChange = async (newCustId: string) => {
    setCustomerId(newCustId);
    const units = await WorkOrderService.getCustomerUnits(newCustId);
    setAcUnits(units);
    if (units.length > 0) {
      setAcUnitId(units[0].id);
    } else {
      setAcUnitId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Silakan pilih pelanggan");
      return;
    }
    if (!title.trim()) {
      setError("Judul pekerjaan wajib diisi");
      return;
    }
    if (!problemDescription.trim()) {
      setError("Deskripsi masalah / keluhan wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const newWo = await WorkOrderService.createWorkOrder({
        customer_id: customerId,
        ac_unit_id: acUnitId || undefined,
        title,
        problem_description: problemDescription,
        service_type: serviceType,
        priority,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
        assigned_technician_id: assignedTechnicianId || undefined,
        labor_fee: Number(laborFee) || 0,
        parts_fee: Number(partsFee) || 0,
        discount_amount: Number(discountAmount) || 0,
        created_by: currentUser.id,
      });

      router.push(`/work-orders/${newWo.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal membuat work order";
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Menyiapkan formulir work order...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Pekerjaan
        </Link>
      </div>

      <PageHeader
        title="Buat Work Order Baru"
        description="Daftarkan order servis, tetapkan jadwal kunjungan, dan langsung tugaskan teknisi lapangan."
      />

      {error && (
        <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Customer & Unit AC */}
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            1. Informasi Pelanggan & Unit AC
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Pilih Pelanggan <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Unit AC yang Dikerjakan
              </label>
              <select
                value={acUnitId}
                onChange={(e) => setAcUnitId(e.target.value)}
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Pilih Unit Terdaftar (Opsional) --</option>
                {acUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.brand} ({u.capacity_pk} PK) - {u.location_detail || u.model || "Unit"}
                  </option>
                ))}
              </select>
              {acUnits.length === 0 && (
                <p className="text-[11px] text-zinc-400 mt-1">
                  Pelanggan ini belum memiliki unit AC terdaftar. Anda bisa mendaftarkannya nanti.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Problem & Service Details */}
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            2. Detail Keluhan & Jenis Servis
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Judul Ringkas Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Cuci Rutin 2 Unit atau AC Indoor Meneteskan Air"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Deskripsi Masalah / Catatan Keluhan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan kendala yang disampaikan pelanggan secara detail..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kategori Servis
              </label>
              <select
                value={serviceType}
                onChange={(e) =>
                  setServiceType(
                    e.target.value as "cleaning" | "repair" | "maintenance" | "installation" | "relocation" | "inspection"
                  )
                }
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="cleaning">Pembersihan / Cuci AC</option>
                <option value="repair">Perbaikan / Ganti Sparepart</option>
                <option value="maintenance">Perawatan Berkala Kontrak</option>
                <option value="installation">Pemasangan Unit Baru</option>
                <option value="relocation">Bongkar Pasang / Relokasi</option>
                <option value="inspection">Pengecekan / Troubleshooting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high" | "urgent")
                }
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="low">Rendah (Fleksibel)</option>
                <option value="medium">Sedang (Standar)</option>
                <option value="high">Tinggi (Komersial / Penting)</option>
                <option value="urgent">Mendesak (Server / Klinik / Overheat)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Scheduling & Dispatch Assignment */}
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            3. Penjadwalan & Penugasan Teknisi (Opsional Langsung)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Jadwal Mulai Kunjungan
              </label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Perkiraan Selesai
              </label>
              <input
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tugaskan Teknisi Lapangan
            </label>
            <select
              value={assignedTechnicianId}
              onChange={(e) => setAssignedTechnicianId(e.target.value)}
              className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">-- Belum Ditugaskan (Admin akan dispatch nanti) --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 4: Fees estimation */}
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            4. Perkiraan Biaya Jasa & Sparepart
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Biaya Jasa (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={laborFee}
                onChange={(e) => setLaborFee(Number(e.target.value))}
                className="w-full text-xs font-mono p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Estimasi Sparepart (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={partsFee}
                onChange={(e) => setPartsFee(Number(e.target.value))}
                className="w-full text-xs font-mono p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Potongan / Diskon (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full text-xs font-mono p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/work-orders"
            className="px-4 py-2 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? "Menyimpan..." : "Simpan & Buat Work Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
