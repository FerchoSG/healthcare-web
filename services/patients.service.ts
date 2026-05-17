import { api } from "@/lib/api-client";
import type { Appointment, Gender, PaginatedResponse, Patient } from "@/types/api";

export interface PatientQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  identification: string;
  birth_date: string;
  gender: Gender;
  whatsapp_phone?: string;
  emergency_contact?: Record<string, unknown>;
}

export function fetchPatients(query: PatientQuery = {}): Promise<PaginatedResponse<Patient>> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  return api.get<PaginatedResponse<Patient>>(`/patients${qs ? `?${qs}` : ""}`);
}

export function fetchPatient(id: string): Promise<Patient> {
  return api.get<Patient>(`/patients/${encodeURIComponent(id)}`);
}

export function fetchPatientAppointments(id: string): Promise<Appointment[]> {
  return api.get<Appointment[]>(`/patients/${encodeURIComponent(id)}/appointments`);
}

export function createPatient(payload: CreatePatientPayload): Promise<Patient> {
  return api.post<Patient>("/patients", payload);
}
