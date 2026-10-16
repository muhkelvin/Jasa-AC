"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  MapPin,
  Wind,
  Search,
  ChevronRight,
  PlusCircle,
  X,
} from "lucide-react";
import { WorkOrderService } from "@/lib/services/work-order-service";
import { Customer, AcUnit } from "@/types/database";
import { CapacityChip } from "@/components/ui/capacity-chip";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<AcUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [selectedCustomerForUnit, setSelectedCustomerForUnit] = useState<string>("");

  // Customer Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNotes, setCustNotes] = useState("");

  // Unit Form State
  const [unitBrand, setUnitBrand] = useState("Daikin");
  const [unitModel, setUnitModel] = useState("");
  const [unitCapacity, setUnitCapacity] = useState(1.0);
  const [unitSerial, setUnitSerial] = useState("");
  const [unitLocation, setUnitLocation] = useState("");
  const [unitNotes, setUnitNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    const c = await WorkOrderService.getCustomers();
    setCustomers(c);

    // Fetch units for all customers
    const allUnits: AcUnit[] = [];
    for (const cust of c) {
      const u = await WorkOrderService.getCustomerUnits(cust.id);
      allUnits.push(...u);
    }
    setUnits(allUnits);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) return;

    await WorkOrderService.createCustomer({
      name: custName,
      phone: custPhone,
      email: custEmail.trim() ? custEmail : undefined,
      address: custAddress,
      notes: custNotes.trim() ? custNotes : undefined,
    });

    setShowAddCustomer(false);
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustAddress("");
    setCustNotes("");
    await loadData();
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForUnit || !unitBrand.trim()) return;

    await WorkOrderService.createAcUnit({
      customer_id: selectedCustomerForUnit,
      brand: unitBrand,
      model: unitModel.trim() ? unitModel : undefined,
      capacity_pk: Number(unitCapacity) || 1.0,
      serial_number: unitSerial.trim() ? unitSerial : undefined,
      location_detail: unitLocation.trim() ? unitLocation : undefined,
      notes: unitNotes.trim() ? unitNotes : undefined,
    });

    setShowAddUnit(false);
    setUnitBrand("Daikin");
    setUnitModel("");
    setUnitCapacity(1.0);
    setUnitSerial("");
    setUnitLocation("");
    setUnitNotes("");
    await loadData();
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Database Pelanggan & Unit AC"
        description="Pusat data pelanggan servis, riwayat kepemilikan unit AC, kapasitas pendinginan, dan catatan lokasi pemasangan."
        actions={
          <button
            onClick={() => setShowAddCustomer(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pelanggan
          </button>
        }
      />

      {/* Search Input */}
      <div className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
        <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Cari nama pelanggan, nomor kontak, atau alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Memuat data pelanggan dan unit AC...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 border border-dashed rounded-lg">
          Tidak ada pelanggan yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((cust) => {
            const customerUnits = units.filter((u) => u.customer_id === cust.id);

            return (
              <div
                key={cust.id}
                className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {cust.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <a href={`tel:${cust.phone}`} className="hover:underline">
                          {cust.phone}
                        </a>
                      </span>
                      {cust.email && <span>• {cust.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCustomerForUnit(cust.id);
                        setShowAddUnit(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                    >
                      <PlusCircle className="w-3 h-3 text-blue-600" />
                      + Daftarkan Unit AC
                    </button>
                  </div>
                </div>

                {/* Address & Notes */}
                <div className="text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{cust.address}</span>
                  </div>
                  {cust.notes && (
                    <div className="text-[11px] text-zinc-500 italic pl-5">
                      Catatan: {cust.notes}
                    </div>
                  )}
                </div>

                {/* Registered AC Units */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-500" />
                    Unit AC Terdaftar ({customerUnits.length})
                  </div>

                  {customerUnits.length === 0 ? (
                    <div className="text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded border border-zinc-100 dark:border-zinc-800">
                      Belum ada unit AC yang didaftarkan untuk pelanggan ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {customerUnits.map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-800/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {u.brand}
                            </span>
                            <CapacityChip capacity={u.capacity_pk} />
                          </div>
                          {u.model && (
                            <div className="text-[11px] text-zinc-500 font-mono truncate">
                              Model: {u.model}
                            </div>
                          )}
                          {u.location_detail && (
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                              Lokasi: {u.location_detail}
                            </div>
                          )}
                          {u.serial_number && (
                            <div className="text-[10px] text-zinc-400 font-mono">
                              SN: {u.serial_number}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Tambah Pelanggan Baru
              </h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap / Instansi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian Anggoro / PT Mandiri Karya"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="Contoh: customer@email.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Alamat Lengkap Lokasi Servis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Parkir mobil aman di carport, hubungi resepsionis lantai 2"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add AC Unit Modal */}
      {showAddUnit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Daftarkan Unit AC Baru
              </h3>
              <button
                onClick={() => setShowAddUnit(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Merk AC <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unitBrand}
                    onChange={(e) => setUnitBrand(e.target.value)}
                    className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Daikin">Daikin</option>
                    <option value="Panasonic">Panasonic</option>
                    <option value="Sharp">Sharp</option>
                    <option value="Gree">Gree</option>
                    <option value="LG">LG</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Polytron">Polytron</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Kapasitas (PK) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unitCapacity}
                    onChange={(e) => setUnitCapacity(Number(e.target.value))}
                    className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  >
                    <option value={0.5}>0.5 PK (1/2 PK)</option>
                    <option value={0.75}>0.75 PK (3/4 PK)</option>
                    <option value={1.0}>1.0 PK</option>
                    <option value={1.5}>1.5 PK</option>
                    <option value={2.0}>2.0 PK</option>
                    <option value={2.5}>2.5 PK</option>
                    <option value={3.0}>3.0 PK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Model / Seri Unit
                </label>
                <input
                  type="text"
                  placeholder="Contoh: FTKQ25UVM4 (Inverter Flash)"
                  value={unitModel}
                  onChange={(e) => setUnitModel(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Lokasi Pemasangan Unit
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kamar Tidur Utama Lantai 2 / Ruang Server"
                  value={unitLocation}
                  onChange={(e) => setUnitLocation(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor Seri / Serial Number
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DKN-2023-8871"
                  value={unitSerial}
                  onChange={(e) => setUnitSerial(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddUnit(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800"
                >
                  Simpan Unit AC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
