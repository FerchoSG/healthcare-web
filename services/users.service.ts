import { api } from "@/lib/api-client";
import type { Role, User } from "@/types/api";

export interface ClinicStaffMember extends User {
  role: Role;
  specialty?: string | null;
  membership_id?: string;
  invite_delivery?: "sent" | "skipped";
  is_active?: boolean;
  deleted_at?: string | null;
}

export interface CreateClinicStaffPayload {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: Exclude<Role, "SUPER_ADMIN">;
  specialty?: string;
}

export interface UpdateClinicStaffPayload {
  role?: Exclude<Role, "SUPER_ADMIN">;
  specialty?: string;
  is_active?: boolean;
}

export function fetchClinicStaff(): Promise<ClinicStaffMember[]> {
  return api.get<ClinicStaffMember[]>("/users");
}

export function createClinicStaff(
  payload: CreateClinicStaffPayload,
): Promise<ClinicStaffMember> {
  return api.post<ClinicStaffMember>("/users", payload);
}

export function updateClinicStaff(
  membershipId: string,
  payload: UpdateClinicStaffPayload,
): Promise<ClinicStaffMember> {
  return api.patch<ClinicStaffMember>(`/users/${encodeURIComponent(membershipId)}`, payload);
}

export function deleteClinicStaff(membershipId: string): Promise<ClinicStaffMember> {
  return api.delete<ClinicStaffMember>(`/users/${encodeURIComponent(membershipId)}`);
}
