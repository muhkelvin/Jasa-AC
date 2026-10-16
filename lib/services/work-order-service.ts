import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderAssignment,
  Customer,
  AcUnit,
  Profile,
  ServiceReport,
  Payment,
  WorkOrderStatusHistory,
} from "@/types/database";
import {
  initialWorkOrders,
  initialCustomers,
  initialAcUnits,
  initialProfiles,
  initialAssignments,
  initialServiceReports,
  initialServiceReportParts,
  initialPayments,
  initialStatusHistories,
} from "./mock-data";

// In-memory data holders for local runtime
let workOrders: WorkOrder[] = [...initialWorkOrders];
let customers: Customer[] = [...initialCustomers];
let acUnits: AcUnit[] = [...initialAcUnits];
const profiles: Profile[] = [...initialProfiles];
let assignments: WorkOrderAssignment[] = [...initialAssignments];
let serviceReports: ServiceReport[] = [...initialServiceReports];
let payments: Payment[] = [...initialPayments];
let statusHistories: WorkOrderStatusHistory[] = [...initialStatusHistories];

// Valid workflow transition rules from PRD v1.2 Section 5
export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  new: ["scheduled", "cancelled"],
  scheduled: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["waiting_parts", "pending_review", "cancelled"],
  waiting_parts: ["in_progress", "cancelled"],
  pending_review: ["completed", "in_progress"], // in_progress if rejected
  completed: [], // Immutable without specific audit authorization
  cancelled: [],
};

export class WorkOrderService {
  // Get all work orders with joined relations
  static async getWorkOrders(filter?: {
    status?: WorkOrderStatus;
    technicianId?: string;
    priority?: string;
    search?: string;
  }): Promise<WorkOrder[]> {
    let result = workOrders.map((wo) => {
      const customer = customers.find((c) => c.id === wo.customer_id);
      const ac_unit = acUnits.find((u) => u.id === wo.ac_unit_id);
      const woAssignments = assignments
        .filter((a) => a.work_order_id === wo.id)
        .map((a) => ({
          ...a,
          technician: profiles.find((p) => p.id === a.technician_id),
        }));
      const service_report = serviceReports.find(
        (sr) => sr.work_order_id === wo.id
      );
      const woPayments = payments.filter((p) => p.work_order_id === wo.id);

      return {
        ...wo,
        customer,
        ac_unit,
        assignments: woAssignments,
        service_report,
        payments: woPayments,
      };
    });

    if (filter?.status) {
      result = result.filter((wo) => wo.status === filter.status);
    }

    if (filter?.technicianId) {
      result = result.filter((wo) =>
        wo.assignments?.some((a) => a.technician_id === filter.technicianId)
      );
    }

    if (filter?.priority) {
      result = result.filter((wo) => wo.priority === filter.priority);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (wo) =>
          wo.work_order_number.toLowerCase().includes(q) ||
          wo.title.toLowerCase().includes(q) ||
          wo.customer?.name.toLowerCase().includes(q) ||
          wo.customer?.phone.includes(q) ||
          wo.customer?.address.toLowerCase().includes(q)
      );
    }

    // Sort by scheduled_start or updated_at desc
    return result.sort((a, b) => {
      const dateA = new Date(a.scheduled_start || a.created_at).getTime();
      const dateB = new Date(b.scheduled_start || b.created_at).getTime();
      return dateB - dateA;
    });
  }

  // Get single work order by ID with all relations & history
  static async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    const wo = workOrders.find((w) => w.id === id);
    if (!wo) return null;

    const customer = customers.find((c) => c.id === wo.customer_id);
    const ac_unit = acUnits.find((u) => u.id === wo.ac_unit_id);
    const woAssignments = assignments
      .filter((a) => a.work_order_id === wo.id)
      .map((a) => ({
        ...a,
        technician: profiles.find((p) => p.id === a.technician_id),
      }));
    const report = serviceReports.find((sr) => sr.work_order_id === wo.id);
    const reportParts = report
      ? initialServiceReportParts.filter(
          (p) => p.service_report_id === report.id
        )
      : [];
    const service_report = report
      ? {
          ...report,
          technician: profiles.find((p) => p.id === report.technician_id),
          parts: reportParts,
        }
      : undefined;

    const woPayments = payments.filter((p) => p.work_order_id === wo.id);

    return {
      ...wo,
      customer,
      ac_unit,
      assignments: woAssignments,
      service_report,
      payments: woPayments,
    };
  }

  // Get status history for a work order
  static async getStatusHistory(
    workOrderId: string
  ): Promise<WorkOrderStatusHistory[]> {
    return statusHistories
      .filter((h) => h.work_order_id === workOrderId)
      .map((h) => ({
        ...h,
        changer: profiles.find((p) => p.id === h.changed_by),
      }))
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }

  // Validate state machine transition
  static validateTransition(
    currentStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus
  ): { valid: boolean; message?: string } {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return {
        valid: false,
        message: `Transisi status tidak diizinkan: dari '${currentStatus}' ke '${nextStatus}'.`,
      };
    }
    return { valid: true };
  }

  // Change status with audit & history logging
  static async transitionStatus(params: {
    workOrderId: string;
    nextStatus: WorkOrderStatus;
    actorId: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; workOrder?: WorkOrder }> {
    const woIndex = workOrders.findIndex((w) => w.id === params.workOrderId);
    if (woIndex === -1) {
      return { success: false, error: "Work order tidak ditemukan" };
    }

    const currentWo = workOrders[woIndex];
    const validation = this.validateTransition(
      currentWo.status,
      params.nextStatus
    );
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    const oldStatus = currentWo.status;
    const now = new Date().toISOString();

    // Update status and timestamps
    workOrders[woIndex] = {
      ...currentWo,
      status: params.nextStatus,
      completed_at:
        params.nextStatus === "completed" ? now : currentWo.completed_at,
      cancel_reason:
        params.nextStatus === "cancelled"
          ? params.reason || "Dibatalkan oleh admin"
          : currentWo.cancel_reason,
      updated_at: now,
    };

    // Log history
    statusHistories.push({
      id: `hist-${Date.now()}`,
      work_order_id: params.workOrderId,
      old_status: oldStatus,
      new_status: params.nextStatus,
      changed_by: params.actorId,
      reason: params.reason || null,
      created_at: now,
    });

    const updated = await this.getWorkOrderById(params.workOrderId);
    return { success: true, workOrder: updated! };
  }

  // Create work order
  static async createWorkOrder(data: {
    customer_id: string;
    ac_unit_id?: string;
    title: string;
    problem_description: string;
    service_type: WorkOrder["service_type"];
    priority: WorkOrder["priority"];
    scheduled_start?: string;
    scheduled_end?: string;
    assigned_technician_id?: string;
    labor_fee: number;
    parts_fee: number;
    discount_amount: number;
    created_by: string;
  }): Promise<WorkOrder> {
    const nextNumber = `WO-2026-${String(workOrders.length + 1).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const newId = `w-new-${Date.now()}`;

    let initialStatus: WorkOrderStatus = "new";
    if (data.scheduled_start && data.assigned_technician_id) {
      initialStatus = "assigned";
    } else if (data.scheduled_start) {
      initialStatus = "scheduled";
    }

    const newWo: WorkOrder = {
      id: newId,
      work_order_number: nextNumber,
      customer_id: data.customer_id,
      ac_unit_id: data.ac_unit_id || null,
      title: data.title,
      problem_description: data.problem_description,
      service_type: data.service_type,
      priority: data.priority,
      status: initialStatus,
      scheduled_start: data.scheduled_start || null,
      scheduled_end: data.scheduled_end || null,
      created_by: data.created_by,
      labor_fee: data.labor_fee,
      parts_fee: data.parts_fee,
      discount_amount: data.discount_amount,
      total_amount: data.labor_fee + data.parts_fee - data.discount_amount,
      cancel_reason: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    workOrders.unshift(newWo);

    // Initial status history
    statusHistories.push({
      id: `hist-create-${Date.now()}`,
      work_order_id: newId,
      old_status: null,
      new_status: initialStatus,
      changed_by: data.created_by,
      reason: "Work order baru didaftarkan",
      created_at: now,
    });

    // If technician assigned directly
    if (data.assigned_technician_id) {
      assignments.push({
        id: `asg-${Date.now()}`,
        work_order_id: newId,
        technician_id: data.assigned_technician_id,
        assigned_by: data.created_by,
        assigned_at: now,
      });
    }

    const fullWo = await this.getWorkOrderById(newId);
    return fullWo!;
  }

  // Assign technician to work order
  static async assignTechnician(params: {
    workOrderId: string;
    technicianId: string;
    assignedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    const wo = workOrders.find((w) => w.id === params.workOrderId);
    if (!wo) return { success: false, error: "Work order tidak ditemukan" };

    // Prevent duplicate assignment
    const exists = assignments.some(
      (a) =>
        a.work_order_id === params.workOrderId &&
        a.technician_id === params.technicianId
    );
    if (!exists) {
      assignments.push({
        id: `asg-${Date.now()}`,
        work_order_id: params.workOrderId,
        technician_id: params.technicianId,
        assigned_by: params.assignedBy,
        assigned_at: new Date().toISOString(),
      });
    }

    // Advance status to assigned if currently new or scheduled
    if (wo.status === "new" || wo.status === "scheduled") {
      await this.transitionStatus({
        workOrderId: params.workOrderId,
        nextStatus: "assigned",
        actorId: params.assignedBy,
        reason: `Penugasan teknisi (${profiles.find((p) => p.id === params.technicianId)?.full_name || "Teknisi"})`,
      });
    }

    return { success: true };
  }

  // Submit service report by technician
  static async submitServiceReport(data: {
    work_order_id: string;
    technician_id: string;
    diagnosis: string;
    action_taken: string;
    recommendation?: string;
    before_photo_urls: string[];
    after_photo_urls: string[];
    parts?: {
      item_name: string;
      quantity: number;
      unit: string;
      unit_cost: number;
    }[];
  }): Promise<{ success: boolean; error?: string; report?: ServiceReport }> {
    const wo = workOrders.find((w) => w.id === data.work_order_id);
    if (!wo) return { success: false, error: "Work order tidak ditemukan" };

    const now = new Date().toISOString();
    const reportId = `sr-${Date.now()}`;

    const newReport: ServiceReport = {
      id: reportId,
      work_order_id: data.work_order_id,
      technician_id: data.technician_id,
      diagnosis: data.diagnosis,
      action_taken: data.action_taken,
      recommendation: data.recommendation || null,
      before_photo_urls: data.before_photo_urls,
      after_photo_urls: data.after_photo_urls,
      started_at: wo.scheduled_start || now,
      finished_at: now,
      submitted_at: now,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: now,
      updated_at: now,
    };

    // Replace if existing or add new
    const existingIndex = serviceReports.findIndex(
      (sr) => sr.work_order_id === data.work_order_id
    );
    if (existingIndex >= 0) {
      serviceReports[existingIndex] = newReport;
    } else {
      serviceReports.push(newReport);
    }

    // Automatically transition to pending_review
    await this.transitionStatus({
      workOrderId: data.work_order_id,
      nextStatus: "pending_review",
      actorId: data.technician_id,
      reason: "Laporan servis dikirimkan oleh teknisi untuk review",
    });

    return { success: true, report: newReport };
  }

  // Review & Approve service report by Admin / Owner
  static async reviewServiceReport(params: {
    workOrderId: string;
    reviewerId: string;
    approved: boolean;
    reviewNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const report = serviceReports.find(
      (sr) => sr.work_order_id === params.workOrderId
    );
    if (!report) {
      return { success: false, error: "Laporan servis belum diunggah" };
    }

    const now = new Date().toISOString();
    report.reviewed_by = params.reviewerId;
    report.reviewed_at = now;
    report.review_notes = params.reviewNotes || null;

    if (params.approved) {
      await this.transitionStatus({
        workOrderId: params.workOrderId,
        nextStatus: "completed",
        actorId: params.reviewerId,
        reason: `Laporan disetujui: ${params.reviewNotes || "Pekerjaan sesuai standar operasional"}`,
      });
    } else {
      await this.transitionStatus({
        workOrderId: params.workOrderId,
        nextStatus: "in_progress",
        actorId: params.reviewerId,
        reason: `Laporan ditolak / perlu perbaikan: ${params.reviewNotes || "Periksa kembali hasil kerja"}`,
      });
    }

    return { success: true };
  }

  // Get active technicians
  static async getTechnicians(): Promise<Profile[]> {
    return profiles.filter((p) => p.role === "technician" && p.is_active);
  }

  // Get customers
  static async getCustomers(): Promise<Customer[]> {
    return customers.filter((c) => c.is_active);
  }

  // Get AC units for a customer
  static async getCustomerUnits(customerId: string): Promise<AcUnit[]> {
    return acUnits.filter((u) => u.customer_id === customerId);
  }

  // Create new customer
  static async createCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
  }): Promise<Customer> {
    const newCust: Customer = {
      id: `c-new-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      notes: data.notes || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    customers.unshift(newCust);
    return newCust;
  }

  // Create new AC unit
  static async createAcUnit(data: {
    customer_id: string;
    brand: string;
    model?: string;
    capacity_pk: number;
    serial_number?: string;
    location_detail?: string;
    installed_at?: string;
    notes?: string;
  }): Promise<AcUnit> {
    const newUnit: AcUnit = {
      id: `u-new-${Date.now()}`,
      customer_id: data.customer_id,
      brand: data.brand,
      model: data.model || null,
      capacity_pk: data.capacity_pk,
      serial_number: data.serial_number || null,
      location_detail: data.location_detail || null,
      installed_at: data.installed_at || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    acUnits.push(newUnit);
    return newUnit;
  }

  // Record payment
  static async recordPayment(data: {
    work_order_id: string;
    amount: number;
    payment_method: string;
    recorded_by: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment> {
    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      work_order_id: data.work_order_id,
      amount: data.amount,
      payment_method: data.payment_method,
      status: "paid",
      paid_at: new Date().toISOString(),
      recorded_by: data.recorded_by,
      reference: data.reference || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };
    payments.push(newPayment);
    return newPayment;
  }

  // Dashboard KPI calculation
  static async getDashboardKPI() {
    const totalOrders = workOrders.length;
    const pendingReview = workOrders.filter(
      (w) => w.status === "pending_review"
    );
    const inProgress = workOrders.filter((w) => w.status === "in_progress");
    const unassigned = workOrders.filter(
      (w) => w.status === "new" || w.status === "scheduled"
    );
    const waitingParts = workOrders.filter(
      (w) => w.status === "waiting_parts"
    );
    const completed = workOrders.filter((w) => w.status === "completed");

    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    return {
      totalOrders,
      pendingReviewCount: pendingReview.length,
      inProgressCount: inProgress.length,
      unassignedCount: unassigned.length,
      waitingPartsCount: waitingParts.length,
      completedCount: completed.length,
      totalRevenue,
      attentionList: workOrders
        .filter(
          (w) =>
            w.status === "pending_review" ||
            w.status === "waiting_parts" ||
            w.status === "new"
        )
        .map((wo) => ({
          ...wo,
          customer: customers.find((c) => c.id === wo.customer_id),
          assignments: assignments
            .filter((a) => a.work_order_id === wo.id)
            .map((a) => ({
              ...a,
              technician: profiles.find((p) => p.id === a.technician_id),
            })),
        })),
    };
  }
}
