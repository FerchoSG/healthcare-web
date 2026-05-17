"use client";

import type { ClinicMembershipInfo, MeResponse } from "@/types/api";
import { Role as ApiRole } from "@/types/api";

export type Role = "admin" | "receptionist" | "doctor";

export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "DOCTOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  membership: ClinicMembershipInfo | null;
  memberships: ClinicMembershipInfo[];
}

export const AUTH_ROLE_TO_ROLE: Record<string, Role> = {
  SUPER_ADMIN: "admin",
  ADMIN: "admin",
  STAFF: "receptionist",
  DOCTOR: "doctor",
};

export const ROLE_TO_AUTH_ROLE: Record<Role, AuthRole> = {
  admin: "ADMIN",
  receptionist: "STAFF",
  doctor: "DOCTOR",
};

export const ROLE_NAMES: Record<Role, string> = {
  admin: "Administrador",
  receptionist: "Recepción",
  doctor: "Doctor",
};

export function meToAuthUser(me: MeResponse): AuthUser {
  const membership = me.active_membership;
  return {
    id: me.id,
    name: `${me.first_name} ${me.last_name}`,
    email: me.email,
    role: (membership?.role ?? ApiRole.ADMIN) as AuthRole,
    membership,
    memberships: me.memberships,
  };
}

export type View =
  | "dashboard"
  | "calendar"
  | "patients"
  | "settings"
  | "front-desk"
  | "schedule"
  | "medical-records"
  | "emr";

export type ToothCondition =
  | "healthy"
  | "caries"
  | "filling"
  | "crown"
  | "missing"
  | "extraction";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}
