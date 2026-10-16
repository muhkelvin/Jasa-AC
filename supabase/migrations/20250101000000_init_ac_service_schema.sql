-- ==============================================================================
-- AC SERVICE MANAGEMENT SYSTEM (PRD v1.2)
-- Initial Schema Migration: Tables, Enums, Constraints, Indexes & RLS Policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'technician');

CREATE TYPE work_order_status AS ENUM (
  'new',
  'scheduled',
  'assigned',
  'in_progress',
  'waiting_parts',
  'pending_review',
  'completed',
  'cancelled'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE service_type AS ENUM (
  'cleaning',       -- Cuci AC rutin / deep cleaning
  'repair',         -- Perbaikan kebocoran, kelistrikan, modul
  'maintenance',    -- Perawatan berkala
  'installation',   -- Pemasangan unit baru / pipa
  'relocation',     -- Bongkar pasang / pemindahan
  'inspection'      -- Pengecekan awal / troubleshooting
);

CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- PROFILES (Linked to Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'technician',
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- AC UNITS (Associated with Customers)
CREATE TABLE ac_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  brand TEXT NOT NULL,
  model TEXT,
  capacity_pk NUMERIC(3,2) NOT NULL DEFAULT 1.0, -- e.g. 0.50, 1.00, 1.50, 2.00
  serial_number TEXT,
  location_detail TEXT, -- e.g. 'Kamar Utama Lantai 2', 'Ruang Tamu'
  installed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- WORK ORDERS (Core Dispatch & Job Entity)
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number TEXT NOT NULL UNIQUE, -- e.g. WO-2026-0001
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  ac_unit_id UUID REFERENCES ac_units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  service_type service_type NOT NULL DEFAULT 'cleaning',
  priority priority_level NOT NULL DEFAULT 'medium',
  status work_order_status NOT NULL DEFAULT 'new',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  labor_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (labor_fee >= 0),
  parts_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (parts_fee >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (labor_fee + parts_fee - discount_amount) STORED,
  cancel_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- WORK ORDER ASSIGNMENTS (Many-to-many: Work Orders <-> Technicians)
CREATE TABLE work_order_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_wo_technician UNIQUE(work_order_id, technician_id)
);

-- SERVICE REPORTS (Completed work submission by technician, 1 per work order)
CREATE TABLE service_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL UNIQUE REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  diagnosis TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  recommendation TEXT,
  before_photo_urls TEXT[] DEFAULT '{}',
  after_photo_urls TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- SERVICE REPORT PARTS (Spare parts & materials used during job)
CREATE TABLE service_report_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_report_id UUID NOT NULL REFERENCES service_reports(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pcs', -- e.g. 'pcs', 'meter', 'can', 'botol'
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- PAYMENTS (Payment records for completed / active work orders)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL, -- e.g. 'Cash', 'BCA Transfer', 'QRIS'
  status payment_status NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- WORK ORDER STATUS HISTORY (Immutable audit trail of workflow progression)
CREATE TABLE work_order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  old_status work_order_status,
  new_status work_order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- AUDIT LOGS (Security & Compliance trail for business operations)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'assign_technician', 'approve_report', 'cancel_wo'
  entity_type TEXT NOT NULL, -- 'work_orders', 'service_reports', etc.
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH QUERY PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_ac_units_customer ON ac_units(customer_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_scheduled_start ON work_orders(scheduled_start);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_ac_unit ON work_orders(ac_unit_id);
CREATE INDEX idx_wo_assignments_technician ON work_order_assignments(technician_id);
CREATE INDEX idx_wo_assignments_wo ON work_order_assignments(work_order_id);
CREATE INDEX idx_service_reports_wo ON service_reports(work_order_id);
CREATE INDEX idx_payments_wo ON payments(work_order_id);
CREATE INDEX idx_wo_status_history_wo ON work_order_status_history(work_order_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Helper function to fetch current authenticated user's role from profiles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to check if current user is owner or admin
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to check if current technician is assigned to a given work order
CREATE OR REPLACE FUNCTION is_technician_assigned_to_wo(target_wo_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.work_order_assignments
    WHERE work_order_id = target_wo_id AND technician_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all operational tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_report_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 PROFILES POLICIES
-- Users can view their own profile, or admins/owners can view all active profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin_or_owner()
  );

-- Only owner can create or update roles of users
CREATE POLICY "profiles_owner_manage" ON profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- Users can update basic info of their own profile (not role or is_active)
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- 5.2 CUSTOMERS POLICIES
-- Admins/owners have full access to customers
CREATE POLICY "customers_admin_all" ON customers
  FOR ALL USING (is_admin_or_owner());

-- Technicians can view customers connected to their assigned work orders
CREATE POLICY "customers_technician_select" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      JOIN public.work_order_assignments woa ON woa.work_order_id = wo.id
      WHERE wo.customer_id = customers.id AND woa.technician_id = auth.uid()
    )
  );

-- 5.3 AC UNITS POLICIES
-- Admins/owners full access
CREATE POLICY "ac_units_admin_all" ON ac_units
  FOR ALL USING (is_admin_or_owner());

-- Technicians can view AC units on their assigned work orders
CREATE POLICY "ac_units_technician_select" ON ac_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      JOIN public.work_order_assignments woa ON woa.work_order_id = wo.id
      WHERE wo.ac_unit_id = ac_units.id AND woa.technician_id = auth.uid()
    )
  );

-- 5.4 WORK ORDERS POLICIES
-- Admins/owners full access
CREATE POLICY "work_orders_admin_all" ON work_orders
  FOR ALL USING (is_admin_or_owner());

-- Technicians can view work orders assigned to them
CREATE POLICY "work_orders_technician_select" ON work_orders
  FOR SELECT USING (
    is_technician_assigned_to_wo(id)
  );

-- Technicians can update status only on assigned work orders (labor/parts/fees protected by server actions & constraints)
CREATE POLICY "work_orders_technician_update_status" ON work_orders
  FOR UPDATE USING (
    is_technician_assigned_to_wo(id)
  )
  WITH CHECK (
    is_technician_assigned_to_wo(id)
  );

-- 5.5 WORK ORDER ASSIGNMENTS POLICIES
-- Admins/owners can manage assignments
CREATE POLICY "wo_assignments_admin_all" ON work_order_assignments
  FOR ALL USING (is_admin_or_owner());

-- Technicians can view their own assignments
CREATE POLICY "wo_assignments_technician_select" ON work_order_assignments
  FOR SELECT USING (technician_id = auth.uid());

-- 5.6 SERVICE REPORTS POLICIES
-- Admins/owners full access
CREATE POLICY "service_reports_admin_all" ON service_reports
  FOR ALL USING (is_admin_or_owner());

-- Technicians can view and create/update reports for their assigned work orders
CREATE POLICY "service_reports_technician_select" ON service_reports
  FOR SELECT USING (
    technician_id = auth.uid() OR is_technician_assigned_to_wo(work_order_id)
  );

CREATE POLICY "service_reports_technician_insert" ON service_reports
  FOR INSERT WITH CHECK (
    technician_id = auth.uid() AND is_technician_assigned_to_wo(work_order_id)
  );

CREATE POLICY "service_reports_technician_update" ON service_reports
  FOR UPDATE USING (
    technician_id = auth.uid() AND is_technician_assigned_to_wo(work_order_id)
  );

-- 5.7 SERVICE REPORT PARTS POLICIES
CREATE POLICY "service_report_parts_admin_all" ON service_report_parts
  FOR ALL USING (is_admin_or_owner());

CREATE POLICY "service_report_parts_technician_select" ON service_report_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_reports sr
      WHERE sr.id = service_report_parts.service_report_id
      AND sr.technician_id = auth.uid()
    )
  );

CREATE POLICY "service_report_parts_technician_modify" ON service_report_parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.service_reports sr
      WHERE sr.id = service_report_parts.service_report_id
      AND sr.technician_id = auth.uid()
    )
  );

-- 5.8 PAYMENTS POLICIES
-- Admins/owners can manage payments
CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (is_admin_or_owner());
-- Technicians have NO access to payments table (as per PRD matrix)

-- 5.9 WORK ORDER STATUS HISTORY POLICIES
CREATE POLICY "wo_status_history_admin_all" ON work_order_status_history
  FOR ALL USING (is_admin_or_owner());

CREATE POLICY "wo_status_history_technician_select" ON work_order_status_history
  FOR SELECT USING (
    is_technician_assigned_to_wo(work_order_id)
  );

CREATE POLICY "wo_status_history_technician_insert" ON work_order_status_history
  FOR INSERT WITH CHECK (
    is_technician_assigned_to_wo(work_order_id) AND changed_by = auth.uid()
  );

-- 5.10 AUDIT LOGS POLICIES
-- Only owner and admin can view audit logs (Technician: No access)
CREATE POLICY "audit_logs_admin_select" ON audit_logs
  FOR SELECT USING (is_admin_or_owner());

CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT WITH CHECK (true);
