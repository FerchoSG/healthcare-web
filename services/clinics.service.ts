import { api } from "@/lib/api-client";
import type { Clinic } from "@/types/api";

export type UpdateClinicPayload = Partial<
  Pick<
    Clinic,
    | "name"
    | "phone"
    | "email"
    | "address"
    | "public_phone"
    | "public_email"
    | "logo_path"
    | "theme_color"
    | "booking_enabled"
  >
>;

export function fetchCurrentClinic(): Promise<Clinic> {
  return api.get<Clinic>("/clinics/current");
}

export function updateCurrentClinic(payload: UpdateClinicPayload): Promise<Clinic> {
  return api.patch<Clinic>("/clinics/current", payload);
}
