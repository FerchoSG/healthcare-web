import { api } from "@/lib/api-client";
import type {
  Appointment,
  AppointmentStatus,
  MeResponse,
  TimeBlock,
  CreateTimeBlockPayload,
  UpdateAppointmentPayload,
} from "@/types/api";

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Fetch the authenticated user's profile. */
export function fetchMe(): Promise<MeResponse> {
  return api.get<MeResponse>("/auth/me");
}

// ─── Appointments ─────────────────────────────────────────────────────────────

/** Fetch appointments for a date range. */
export function fetchAppointments(
  startDate?: string,
  endDate?: string,
): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (startDate && endDate && startDate === endDate) {
    params.set("date", startDate);
  } else {
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
  }
  const qs = params.toString();
  return api.get<Appointment[]>(`/appointments${qs ? `?${qs}` : ""}`);
}

/** Fetch today's appointments. */
export function fetchTodayAppointments(): Promise<Appointment[]> {
  const today = new Date().toLocaleDateString("en-CA");
  return fetchAppointments(today, today);
}

/** Update an appointment's status. */
export function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  return api.patch<Appointment>(
    `/appointments/${encodeURIComponent(appointmentId)}/status`,
    { status },
  );
}

/** Update an appointment (reschedule, change reason, etc.). */
export function updateAppointment(
  appointmentId: string,
  payload: UpdateAppointmentPayload,
): Promise<Appointment> {
  return api.patch<Appointment>(
    `/appointments/${encodeURIComponent(appointmentId)}`,
    payload,
  );
}

/** Soft-delete an appointment. */
export function deleteAppointment(appointmentId: string): Promise<void> {
  return api.delete<void>(`/appointments/${encodeURIComponent(appointmentId)}`);
}

// ─── Time Blocks ──────────────────────────────────────────────────────────────

/** Fetch time blocks for a date range (optional doctor filter). */
export function fetchTimeBlocks(
  startDate: string,
  endDate?: string,
  doctorId?: string,
): Promise<TimeBlock[]> {
  const params = new URLSearchParams({ startDate });
  if (endDate) params.set("endDate", endDate);
  if (doctorId) params.set("doctor_id", doctorId);
  return api.get<TimeBlock[]>(`/time-blocks?${params}`);
}

/** Create a new time block for a doctor. */
export function createTimeBlock(
  payload: CreateTimeBlockPayload,
): Promise<TimeBlock> {
  return api.post<TimeBlock>("/time-blocks", payload);
}

/** Delete a time block by id. */
export function deleteTimeBlock(id: string): Promise<void> {
  return api.delete<void>(`/time-blocks/${encodeURIComponent(id)}`);
}
