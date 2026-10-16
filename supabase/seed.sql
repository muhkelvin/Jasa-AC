-- ==============================================================================
-- AC SERVICE MANAGEMENT SYSTEM (PRD v1.2)
-- Realistic Seed Data for Demo & Testing
-- ==============================================================================

-- Demo UUIDs for consistent linking
-- Profiles / Users
-- Owner:      '11111111-1111-1111-1111-111111111111'
-- Admin:      '22222222-2222-2222-2222-222222222222'
-- Tech Doni:  '33333333-3333-3333-3333-333333333333'
-- Tech Agus:  '44444444-4444-4444-4444-444444444444'

-- 1. Insert Demo Users into auth.users (if using Supabase Auth test container or local)
INSERT INTO auth.users (id, email, raw_user_meta_data, role, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'budi.owner@acservice.id', '{"full_name": "Budi Santoso"}', 'authenticated', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'siti.admin@acservice.id', '{"full_name": "Siti Rahma"}', 'authenticated', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'doni.tek@acservice.id', '{"full_name": "Doni Pratama"}', 'authenticated', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'agus.tek@acservice.id', '{"full_name": "Agus Kurniawan"}', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles
INSERT INTO public.profiles (id, role, full_name, phone, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner', 'Budi Santoso (Owner)', '0812-8899-0001', true),
  ('22222222-2222-2222-2222-222222222222', 'admin', 'Siti Rahma (Admin Ops)', '0813-7788-0002', true),
  ('33333333-3333-3333-3333-333333333333', 'technician', 'Doni Pratama', '0819-1122-0003', true),
  ('44444444-4444-4444-4444-444444444444', 'technician', 'Agus Kurniawan', '0857-3344-0004', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- 3. Customers
INSERT INTO public.customers (id, name, phone, email, address, notes)
VALUES
  ('c1111111-0000-0000-0000-000000000001', 'Hendro Wijaya', '0812-9876-5432', 'hendro.w@gmail.com', 'Jl. Flamboyan No. 14, Kebayoran Baru, Jakarta Selatan', 'Rumah tinggal 2 lantai, parkir mobil aman di carport'),
  ('c2222222-0000-0000-0000-000000000002', 'PT Solusi Kreatif Digital (Ibu Nadia)', '0818-5544-3322', 'office@solusikreatif.co.id', 'Gedung Wisma Niaga Lt. 4, Jl. TB Simatupang No. 88, Jaksel', 'Hubungi Bu Nadia resepsionis sebelum naik ke lantai 4'),
  ('c3333333-0000-0000-0000-000000000003', 'dr. Anita Larasati', '0811-2233-4455', 'anita.larasati@yahoo.com', 'Klinik Medika Sehat, Jl. Margonda Raya No. 201, Depok', 'Pengerjaan disarankan jam 08.00 - 10.00 sebelum klinik ramai'),
  ('c4444444-0000-0000-0000-000000000004', 'Rian Anggoro', '0877-6655-4433', 'rian.anggoro@gmail.com', 'Cluster Green Valley Blok C2/15, BSD City, Tangerang Selatan', 'AC di kamar bayi dan master bedroom')
ON CONFLICT (id) DO NOTHING;

-- 4. AC Units
INSERT INTO public.ac_units (id, customer_id, brand, model, capacity_pk, serial_number, location_detail, installed_at, notes)
VALUES
  ('u1111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Daikin', 'FTKQ25UVM4 (Inverter Flash)', 1.00, 'DKN-2023-8871', 'Kamar Tidur Utama Lt 2', '2023-04-10', 'Outdoor di balkon samping'),
  ('u2222222-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'Panasonic', 'CS-PN9WKJ (Standard Non-Inverter)', 1.00, 'PNS-2022-4412', 'Ruang Keluarga Lt 1', '2022-08-15', 'Drainase pipa tembus ke taman belakang'),
  ('u3333333-0000-0000-0000-000000000003', 'c2222222-0000-0000-0000-000000000002', 'Daikin', 'FTNE50MV14 (Standard)', 2.00, 'DKN-2021-9921', 'Ruang Server / IT Office', '2021-11-20', 'Harus beroperasi 24 jam nonstop, suhu 20C'),
  ('u4444444-0000-0000-0000-000000000004', 'c2222222-0000-0000-0000-000000000002', 'Gree', 'GWC-18MOO5', 2.00, 'GRE-2023-1104', 'Open Workspace Lt 4', '2023-01-12', 'Kondisi kisi-kisi outdoor bersih'),
  ('u5555555-0000-0000-0000-000000000005', 'c3333333-0000-0000-0000-000000000003', 'Sharp', 'AH-X9ZY (J-Tech Inverter)', 1.00, 'SHP-2024-0019', 'Ruang Konsultasi Dokter 1', '2024-02-01', 'Filter plasmacluster perlu dibersihkan berkala'),
  ('u6666666-0000-0000-0000-000000000006', 'c4444444-0000-0000-0000-000000000004', 'Panasonic', 'CS-XPU9XKJ (AEROWINGS Inverter)', 1.00, 'PNS-2023-5591', 'Kamar Anak Blok C2/15', '2023-09-05', 'Outdoor di dak atap')
ON CONFLICT (id) DO NOTHING;

-- 5. Work Orders (Covering All Lifecycle Statuses)
INSERT INTO public.work_orders (
  id, work_order_number, customer_id, ac_unit_id, title, problem_description, service_type, priority, status,
  scheduled_start, scheduled_end, created_by, labor_fee, parts_fee, discount_amount, completed_at
)
VALUES
  -- 5.1 NEW
  (
    'w1111111-0000-0000-0000-000000000001', 'WO-2026-0001',
    'c1111111-0000-0000-0000-000000000001', 'u1111111-0000-0000-0000-000000000001',
    'Pengecekan AC Tidak Dingin & Bau Apek',
    'Hembusan angin terasa hangat, ada aroma kurang sedap saat pertama dinyalakan. Lampu timer outdoor berkedip.',
    'inspection', 'medium', 'new',
    null, null,
    '22222222-2222-2222-2222-222222222222', 75000.00, 0.00, 0.00, null
  ),

  -- 5.2 SCHEDULED
  (
    'w2222222-0000-0000-0000-000000000002', 'WO-2026-0002',
    'c2222222-0000-0000-0000-000000000002', 'u4444444-0000-0000-0000-000000000004',
    'Cuci Berkala 2 Unit Kantor',
    'Maintenance 3 bulanan rutin untuk AC open workspace dan meeting room.',
    'cleaning', 'low', 'scheduled',
    timezone('utc', now() + interval '1 day' + interval '2 hours'),
    timezone('utc', now() + interval '1 day' + interval '4 hours'),
    '22222222-2222-2222-2222-222222222222', 150000.00, 0.00, 0.00, null
  ),

  -- 5.3 ASSIGNED (Assigned to Doni)
  (
    'w3333333-0000-0000-0000-000000000003', 'WO-2026-0003',
    'c3333333-0000-0000-0000-000000000003', 'u5555555-0000-0000-0000-000000000005',
    'Bocor Air Menetes dari Indoor ke Meja Dokter',
    'Air menetes deras dari casing kanan indoor. Talang pembuangan diduga tersumbat lumut tebal.',
    'repair', 'high', 'assigned',
    timezone('utc', now() + interval '3 hours'),
    timezone('utc', now() + interval '5 hours'),
    '22222222-2222-2222-2222-222222222222', 120000.00, 0.00, 0.00, null
  ),

  -- 5.4 IN PROGRESS (Assigned to Doni, currently working)
  (
    'w4444444-0000-0000-0000-000000000004', 'WO-2026-0004',
    'c4444444-0000-0000-0000-000000000004', 'u6666666-0000-0000-0000-000000000006',
    'Relokasi Unit AC Kamar Anak ke Kamar Tamu',
    'Pemindahan posisi indoor dan outdoor, penyesuaian jalur pipa tembaga 3 meter.',
    'relocation', 'medium', 'in_progress',
    timezone('utc', now() - interval '1 hour'),
    timezone('utc', now() + interval '2 hours'),
    '22222222-2222-2222-2222-222222222222', 350000.00, 150000.00, 25000.00, null
  ),

  -- 5.5 WAITING PARTS (Assigned to Agus)
  (
    'w5555555-0000-0000-0000-000000000005', 'WO-2026-0005',
    'c2222222-0000-0000-0000-000000000002', 'u3333333-0000-0000-0000-000000000003',
    'Fan Motor Outdoor Mati - AC Server Overheat',
    'Kompresor jalan tapi fan outdoor macet. Kapasitor fan 2.5uF kembung dan hangus. Menunggu part pengganti.',
    'repair', 'urgent', 'waiting_parts',
    timezone('utc', now() - interval '3 hours'),
    timezone('utc', now() + interval '1 hour'),
    '22222222-2222-2222-2222-222222222222', 200000.00, 185000.00, 0.00, null
  ),

  -- 5.6 PENDING REVIEW (Assigned to Agus, report submitted)
  (
    'w6666666-0000-0000-0000-000000000006', 'WO-2026-0006',
    'c1111111-0000-0000-0000-000000000001', 'u2222222-0000-0000-0000-000000000002',
    'Penggantian Kapasitor Kompresor 25uF & Isi Freon R32',
    'Kompresor gagal starting, tekanan freon rendah 60 psi. Sudah diganti dan diisi hingga 140 psi.',
    'repair', 'high', 'pending_review',
    timezone('utc', now() - interval '4 hours'),
    timezone('utc', now() - interval '2 hours'),
    '22222222-2222-2222-2222-222222222222', 175000.00, 225000.00, 0.00, null
  ),

  -- 5.7 COMPLETED (Fully reviewed, paid)
  (
    'w7777777-0000-0000-0000-000000000007', 'WO-2026-0007',
    'c1111111-0000-0000-0000-000000000001', 'u1111111-0000-0000-0000-000000000001',
    'Deep Cleaning & Desinfeksi Bakteri Daikin Inverter',
    'Pembersihan evaporator, blower drum indoor, dan kondensor outdoor. Performa pendinginan kembali optimal.',
    'cleaning', 'medium', 'completed',
    timezone('utc', now() - interval '2 days'),
    timezone('utc', now() - interval '2 days' + interval '2 hours'),
    '22222222-2222-2222-2222-222222222222', 150000.00, 0.00, 0.00,
    timezone('utc', now() - interval '2 days' + interval '3 hours')
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Work Order Assignments
INSERT INTO public.work_order_assignments (work_order_id, technician_id, assigned_by, assigned_at)
VALUES
  ('w3333333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', now() - interval '1 hour'),
  ('w4444444-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', now() - interval '2 hours'),
  ('w5555555-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', now() - interval '4 hours'),
  ('w6666666-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', now() - interval '5 hours'),
  ('w7777777-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- 7. Service Reports (For WO-0006 pending review, and WO-0007 completed)
INSERT INTO public.service_reports (
  id, work_order_id, technician_id, diagnosis, action_taken, recommendation,
  before_photo_urls, after_photo_urls, started_at, finished_at, submitted_at,
  reviewed_by, reviewed_at, review_notes
)
VALUES
  (
    'sr66666-0000-0000-0000-000000000006',
    'w6666666-0000-0000-0000-000000000006',
    '44444444-4444-4444-4444-444444444444',
    'Kapasitor 25uF short-circuit sehingga kompresor overload/humming. Tekanan R32 berada di 65 psi karena ada rembesan nepel valve.',
    'Ganti running capacitor 25uF/450V Daikin. Kencangkan flare fitting nepel outdoor, vacuum jalur, dan isi Freon R32 murni hingga 140 psi.',
    'Pantau suhu pipa balik outdoor dalam 1 minggu. Jika dingin berkurang, perlu flaring ulang sambungan pipa tembaga.',
    ARRAY['/demo/ac_before_1.jpg'],
    ARRAY['/demo/ac_after_1.jpg'],
    now() - interval '4 hours',
    now() - interval '2 hours',
    now() - interval '1 hour',
    null, null, null
  ),
  (
    'sr77777-0000-0000-0000-000000000007',
    'w7777777-0000-0000-0000-000000000007',
    '33333333-3333-3333-3333-333333333333',
    'Debu tebal menutup sirip evaporator indoor dan kondensor outdoor. Aliran udara turun 40%.',
    'Pembersihan steam bertekanan tinggi pada indoor dan outdoor. Semprot cairan desinfektan antibakteri. Cek arus listrik normal 3.8 Ampere.',
    'Jadwalkan pencucian rutin berikutnya 3 bulan lagi (November 2026).',
    ARRAY['/demo/ac_clean_before.jpg'],
    ARRAY['/demo/ac_clean_after.jpg'],
    now() - interval '2 days',
    now() - interval '2 days' + interval '2 hours',
    now() - interval '2 days' + interval '2 hours',
    '22222222-2222-2222-2222-222222222222',
    now() - interval '2 days' + interval '3 hours',
    'Pekerjaan rapi, area kerja ditinggalkan bersih. Disetujui.'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Service Report Parts
INSERT INTO public.service_report_parts (service_report_id, item_name, quantity, unit, unit_cost)
VALUES
  ('sr66666-0000-0000-0000-000000000006', 'Kapasitor Daikin 25 uF / 450V', 1.00, 'pcs', 125000.00),
  ('sr66666-0000-0000-0000-000000000006', 'Refill Freon R32 Original (0.5 kg)', 1.00, 'unit', 100000.00)
ON CONFLICT DO NOTHING;

-- 9. Payments (For WO-0007 Completed)
INSERT INTO public.payments (id, work_order_id, amount, payment_method, status, paid_at, recorded_by, reference, notes)
VALUES
  (
    'p7777777-0000-0000-0000-000000000007',
    'w7777777-0000-0000-0000-000000000007',
    150000.00,
    'BCA Transfer',
    'paid',
    now() - interval '2 days' + interval '3 hours',
    '22222222-2222-2222-2222-222222222222',
    'TRF-BCA-9882103',
    'Pelanggan transfer via m-BCA langsung setelah teknisi selesai'
  )
ON CONFLICT (id) DO NOTHING;

-- 10. Status History Sample
INSERT INTO public.work_order_status_history (work_order_id, old_status, new_status, changed_by, reason, created_at)
VALUES
  ('w6666666-0000-0000-0000-000000000006', null, 'new', '22222222-2222-2222-2222-222222222222', 'Order dibuat dari laporan telepon pelanggan', now() - interval '6 hours'),
  ('w6666666-0000-0000-0000-000000000006', 'new', 'scheduled', '22222222-2222-2222-2222-222222222222', 'Jadwal kunjungan disepakati pukul 13.00', now() - interval '5 hours' + interval '30 minutes'),
  ('w6666666-0000-0000-0000-000000000006', 'scheduled', 'assigned', '22222222-2222-2222-2222-222222222222', 'Ditugaskan ke Teknisi Agus Kurniawan', now() - interval '5 hours'),
  ('w6666666-0000-0000-0000-000000000006', 'assigned', 'in_progress', '44444444-4444-4444-4444-444444444444', 'Teknisi tiba di lokasi dan memulai pengecekan', now() - interval '4 hours'),
  ('w6666666-0000-0000-0000-000000000006', 'in_progress', 'pending_review', '44444444-4444-4444-4444-444444444444', 'Pengerjaan selesai dan laporan servis diunggah teknisi', now() - interval '1 hour')
ON CONFLICT DO NOTHING;
