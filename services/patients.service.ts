import { api } from "@/lib/api-client";
import type { PaginatedResponse, Patient } from "@/types/api";

export interface PatientQuery {
  search?: string;
  page?: number;
  limit?: number;
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
