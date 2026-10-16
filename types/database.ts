export type UserRole = 'owner' | 'admin' | 'technician';

export type WorkOrderStatus =
  | 'new'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'waiting_parts'
  | 'pending_review'
  | 'completed'
  | 'cancelled';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceType =
  | 'cleaning'
  | 'repair'
  | 'maintenance'
  | 'installation'
  | 'relocation'
  | 'inspection';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcUnit {
  id: string;
  customer_id: string;
  brand: string;
  model: string | null;
  capacity_pk: number;
  serial_number: string | null;
  location_detail: string | null;
  installed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface WorkOrder {
  id: string;
  work_order_number: string;
  customer_id: string;
  ac_unit_id: string | null;
  title: string;
  problem_description: string;
  service_type: ServiceType;
  priority: PriorityLevel;
  status: WorkOrderStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_by: string | null;
  labor_fee: number;
  parts_fee: number;
  discount_amount: number;
  total_amount?: number;
  cancel_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  ac_unit?: AcUnit;
  assignments?: WorkOrderAssignment[];
  service_report?: ServiceReport;
  payments?: Payment[];
}

export interface WorkOrderAssignment {
  id: string;
  work_order_id: string;
  technician_id: string;
  assigned_by: string | null;
  assigned_at: string;
  technician?: Profile;
}

export interface ServiceReport {
  id: string;
  work_order_id: string;
  technician_id: string;
  diagnosis: string;
  action_taken: string;
  recommendation: string | null;
  before_photo_urls: string[];
  after_photo_urls: string[];
  started_at: string;
  finished_at: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  technician?: Profile;
  parts?: ServiceReportPart[];
}

export interface ServiceReportPart {
  id: string;
  service_report_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  subtotal?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  work_order_id: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  paid_at: string;
  recorded_by: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkOrderStatusHistory {
  id: string;
  work_order_id: string;
  old_status: WorkOrderStatus | null;
  new_status: WorkOrderStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
  changer?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}
