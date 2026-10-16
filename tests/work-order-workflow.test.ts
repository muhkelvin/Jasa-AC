import { describe, it, expect } from "vitest";
import { WorkOrderService, VALID_TRANSITIONS } from "../lib/services/work-order-service";
import { WorkOrderStatus } from "../types/database";

describe("AC Service Management System - Workflow & Business Logic Tests", () => {
  it("should have correct state transition definitions per PRD v1.2", () => {
    expect(VALID_TRANSITIONS.new).toContain("scheduled");
    expect(VALID_TRANSITIONS.new).toContain("cancelled");
    expect(VALID_TRANSITIONS.new).not.toContain("completed");

    expect(VALID_TRANSITIONS.scheduled).toContain("assigned");
    expect(VALID_TRANSITIONS.assigned).toContain("in_progress");
    expect(VALID_TRANSITIONS.in_progress).toContain("waiting_parts");
    expect(VALID_TRANSITIONS.in_progress).toContain("pending_review");
    expect(VALID_TRANSITIONS.waiting_parts).toContain("in_progress");
    expect(VALID_TRANSITIONS.pending_review).toContain("completed");
    expect(VALID_TRANSITIONS.pending_review).toContain("in_progress"); // Rejected for revision
  });

  it("should block illegal state transitions", () => {
    // New cannot jump directly to completed
    const jumpCheck1 = WorkOrderService.validateTransition("new", "completed");
    expect(jumpCheck1.valid).toBe(false);
    expect(jumpCheck1.message).toBeDefined();

    // Assigned cannot jump directly to completed without report & review
    const jumpCheck2 = WorkOrderService.validateTransition("assigned", "completed");
    expect(jumpCheck2.valid).toBe(false);

    // Completed state is terminal and immutable
    const jumpCheck3 = WorkOrderService.validateTransition("completed", "in_progress");
    expect(jumpCheck3.valid).toBe(false);
  });

  it("should allow valid sequential transitions", () => {
    expect(WorkOrderService.validateTransition("new", "scheduled").valid).toBe(true);
    expect(WorkOrderService.validateTransition("scheduled", "assigned").valid).toBe(true);
    expect(WorkOrderService.validateTransition("assigned", "in_progress").valid).toBe(true);
    expect(WorkOrderService.validateTransition("in_progress", "waiting_parts").valid).toBe(true);
    expect(WorkOrderService.validateTransition("waiting_parts", "in_progress").valid).toBe(true);
    expect(WorkOrderService.validateTransition("in_progress", "pending_review").valid).toBe(true);
    expect(WorkOrderService.validateTransition("pending_review", "completed").valid).toBe(true);
  });

  it("should calculate work order total fee accurately", async () => {
    const wo = await WorkOrderService.createWorkOrder({
      customer_id: "c1111111-0000-0000-0000-000000000001",
      title: "Uji Coba Kalkulasi Total Biaya",
      problem_description: "Pengujian unit test untuk verifikasi nominal rupiah",
      service_type: "repair",
      priority: "medium",
      labor_fee: 150000,
      parts_fee: 75000,
      discount_amount: 25000,
      created_by: "22222222-2222-2222-2222-222222222222",
    });

    expect(wo.labor_fee).toBe(150000);
    expect(wo.parts_fee).toBe(75000);
    expect(wo.discount_amount).toBe(25000);
    // 150000 + 75000 - 25000 = 200000
    expect(wo.total_amount).toBe(200000);
  });

  it("should record immutable audit history on status changes", async () => {
    const wo = await WorkOrderService.createWorkOrder({
      customer_id: "c1111111-0000-0000-0000-000000000001",
      title: "Uji Audit Log Transition",
      problem_description: "Audit trail test",
      service_type: "inspection",
      priority: "low",
      labor_fee: 50000,
      parts_fee: 0,
      discount_amount: 0,
      created_by: "22222222-2222-2222-2222-222222222222",
    });

    // Advance to scheduled
    await WorkOrderService.transitionStatus({
      workOrderId: wo.id,
      nextStatus: "scheduled",
      actorId: "22222222-2222-2222-2222-222222222222",
      reason: "Jadwal disepakati besok pagi",
    });

    const history = await WorkOrderService.getStatusHistory(wo.id);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[history.length - 1].new_status).toBe("scheduled");
    expect(history[history.length - 1].reason).toBe("Jadwal disepakati besok pagi");
  });
});
