import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Nama pelanggan minimal 2 karakter"),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  notes: z.string().optional().or(z.literal("")),
});

export const CreateAcUnitSchema = z.object({
  customer_id: z.string().uuid("Customer ID tidak valid"),
  brand: z.string().min(2, "Merk AC minimal 2 karakter"),
  model: z.string().optional().or(z.literal("")),
  capacity_pk: z.number().min(0.5, "Kapasitas minimal 0.5 PK").max(10, "Kapasitas maksimal 10 PK"),
  serial_number: z.string().optional().or(z.literal("")),
  location_detail: z.string().optional().or(z.literal("")),
  installed_at: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const CreateWorkOrderSchema = z.object({
  customer_id: z.string().uuid("Pilih pelanggan yang valid"),
  ac_unit_id: z.string().uuid("Pilih unit AC").optional().or(z.literal("")),
  title: z.string().min(3, "Judul pekerjaan minimal 3 karakter"),
  problem_description: z.string().min(5, "Deskripsi masalah minimal 5 karakter"),
  service_type: z.enum([
    "cleaning",
    "repair",
    "maintenance",
    "installation",
    "relocation",
    "inspection",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduled_start: z.string().optional().or(z.literal("")),
  scheduled_end: z.string().optional().or(z.literal("")),
  assigned_technician_id: z.string().optional().or(z.literal("")),
  labor_fee: z.number().min(0, "Biaya jasa tidak boleh negatif").default(0),
  parts_fee: z.number().min(0, "Biaya suku cadang tidak boleh negatif").default(0),
  discount_amount: z.number().min(0, "Diskon tidak boleh negatif").default(0),
});

export const SubmitServiceReportSchema = z.object({
  work_order_id: z.string().uuid(),
  diagnosis: z.string().min(5, "Diagnosis minimal 5 karakter"),
  action_taken: z.string().min(5, "Tindakan perbaikan minimal 5 karakter"),
  recommendation: z.string().optional().or(z.literal("")),
  before_photo_urls: z.array(z.string()).default([]),
  after_photo_urls: z.array(z.string()).default([]),
  parts: z
    .array(
      z.object({
        item_name: z.string().min(1, "Nama barang tidak boleh kosong"),
        quantity: z.number().min(0.1, "Jumlah minimal 0.1"),
        unit: z.string().default("pcs"),
        unit_cost: z.number().min(0, "Harga satuan tidak boleh negatif"),
      })
    )
    .default([]),
});

export const TransitionStatusSchema = z.object({
  action: z.enum([
    "schedule",
    "assign",
    "start",
    "request_parts",
    "resume",
    "submit_report",
    "approve",
    "cancel",
  ]),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  technician_id: z.string().optional(),
  cancel_reason: z.string().optional(),
  review_notes: z.string().optional(),
});
