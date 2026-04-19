import { api } from "@/lib/api-client";
import type {
  ServiceSummary,
  DoctorSummary,
  AvailableSlotsResponse,
  CreateBookingPayload,
  BookingConfirmation,
} from "@/types/api";

const SKIP_AUTH = { skipAuth: true } as const;

/**
 * Fetch the list of active services for a clinic.
 */
export function getServices(clinicId: string): Promise<ServiceSummary[]> {
  return api.get<ServiceSummary[]>(
    `/booking/services?clinic_id=${encodeURIComponent(clinicId)}`,
    SKIP_AUTH,
  );
}

/**
 * Fetch the list of doctors for a clinic, optionally filtered by service.
 */
export function getDoctors(clinicId: string, serviceId?: string): Promise<DoctorSummary[]> {
  const params = new URLSearchParams({ clinic_id: clinicId });
  if (serviceId) params.set("service_id", serviceId);
  return api.get<DoctorSummary[]>(
    `/booking/doctors?${params.toString()}`,
    SKIP_AUTH,
  );
}

/**
 * Fetch available time slots.
 * When doctorId is "any" or omitted, the backend merges slots across all
 * doctors for the given service and attaches a real doctor_id to each slot.
 */
export function getAvailableSlots(
  clinicId: string,
  doctorId: string,
  date: string,
  serviceId?: string,
): Promise<AvailableSlotsResponse> {
  const params = new URLSearchParams({ clinic_id: clinicId, date });
  if (doctorId && doctorId !== "any") {
    params.set("doctor_id", doctorId);
  }
  if (serviceId) {
    params.set("service_id", serviceId);
  }
  return api.get<AvailableSlotsResponse>(
    `/booking/available-slots?${params.toString()}`,
    SKIP_AUTH,
  );
}

/**
 * Create a new appointment from the public booking wizard.
 */
export function createBooking(payload: CreateBookingPayload): Promise<BookingConfirmation> {
  return api.post<BookingConfirmation>("/booking/appointments", payload, SKIP_AUTH);
}
