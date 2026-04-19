import { api } from "@/lib/api-client";
import type {
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  DoctorSummary,
} from "@/types/api";

// ─── Services CRUD ────────────────────────────────────────────────────────────

export function fetchServices(params?: {
  search?: string;
  is_active?: string;
}): Promise<Service[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.is_active) qs.set("is_active", params.is_active);
  const query = qs.toString();
  return api.get<Service[]>(`/services${query ? `?${query}` : ""}`);
}

export function fetchServiceById(id: string): Promise<Service> {
  return api.get<Service>(`/services/${encodeURIComponent(id)}`);
}

export function createService(payload: CreateServicePayload): Promise<Service> {
  return api.post<Service>("/services", payload);
}

export function updateService(
  id: string,
  payload: UpdateServicePayload,
): Promise<Service> {
  return api.patch<Service>(`/services/${encodeURIComponent(id)}`, payload);
}

export function deleteService(id: string): Promise<void> {
  return api.delete<void>(`/services/${encodeURIComponent(id)}`);
}

// ─── Doctors (for doctor assignment) ──────────────────────────────────────────

export function fetchDoctors(): Promise<DoctorSummary[]> {
  return api.get<DoctorSummary[]>("/users").then((users: unknown[]) =>
    (
      users as Array<{
        id: string;
        first_name: string;
        last_name: string;
        role: string;
        specialty: string | null;
      }>
    )
      .filter((u) => u.role === "DOCTOR")
      .map((u) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        specialty: u.specialty,
      })),
  );
}
