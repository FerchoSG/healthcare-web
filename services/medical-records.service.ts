import { api, getAccessToken, getClinicId } from "@/lib/api-client";
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
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    additional_notes?: string;
  };
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

export async function downloadMedicalRecordPdf(recordId: string): Promise<Blob> {
  const token = getAccessToken();
  const clinicId = getClinicId();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clinicId) headers["x-clinic-id"] = clinicId;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/medical-records/${encodeURIComponent(recordId)}/pdf`,
    {
      method: "GET",
      headers,
    },
  );

  if (response.status === 401) {
    throw new Error("Tu sesión venció. Cierra sesión y vuelve a ingresar para descargar el PDF.");
  }

  if (!response.ok) {
    throw new Error("No se pudo generar el PDF del expediente");
  }

  return response.blob();
}
