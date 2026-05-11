import { api } from "@/lib/api-client";
import type { MedicalRecord } from "@/types/api";

export interface CreateMedicalRecordPayload {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  vitals?: Record<string, unknown>;
  diagnosis?: string;
  treatment_plan?: string;
  gynoRecord?: {
    last_menstrual_period?: string;
    estimated_due_date?: string;
    gestational_weeks?: number;
    ultrasound_notes?: string;
    image_url?: string;
  };
  dentalRecords?: Array<{
    tooth_number: number;
    condition?: string;
    surface?: string;
    estimated_budget?: number;
  }>;
}

export function fetchMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  return api.get<MedicalRecord[]>(
    `/patients/${encodeURIComponent(patientId)}/medical-records`,
  );
}

export function createMedicalRecord(
  payload: CreateMedicalRecordPayload,
): Promise<MedicalRecord> {
  return api.post<MedicalRecord>("/medical-records", payload);
}
