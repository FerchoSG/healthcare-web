// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  WAITING = "WAITING",
  IN_CONSULTATION = "IN_CONSULTATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum HaciendaStatus {
  DRAFT = "DRAFT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum PaymentStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
}

export enum Gender {
  M = "M",
  F = "F",
  OTHER = "OTHER",
}

export enum Role {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  STAFF = "STAFF",
}

// ─── Shared / Utility Types ──────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ClinicMembershipInfo {
  clinic_id: string;
  clinic_name: string;
  role: Role;
  specialty: string | null;
}

export interface LoginResponse {
  access_token: string;
  memberships: ClinicMembershipInfo[];
}

export interface MeResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  active_membership: ClinicMembershipInfo | null;
  memberships: ClinicMembershipInfo[];
}

// ─── Clinic ───────────────────────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  tax_id: string;
  phone: string | null;
  email: string | null;
  logo_path: string | null;
  hacienda_api_key: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Service (Clinic Service Catalog) ─────────────────────────────────────────

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number; // cents
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  doctors: UserSummary[];
}

/** Lightweight shape returned by booking endpoints */
export interface ServiceSummary {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

// ─── Service Management Payloads ──────────────────────────────────────────────

export interface CreateServicePayload {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  doctor_ids?: string[];
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_active?: boolean;
  doctor_ids?: string[];
}

// ─── User / Doctor ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
}

export interface DoctorSummary {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  identification: string;
  birth_date: string;
  gender: Gender;
  whatsapp_phone: string | null;
  emergency_contact: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  identification?: string;
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  reminder_sent: boolean;
  createdAt: string;
  updatedAt: string;
  patient: PatientSummary;
  doctor: UserSummary;
  service: ServiceSummary | null;
}

// ─── Medical Record ───────────────────────────────────────────────────────────

export interface GynoRecord {
  id: string;
  medical_record_id: string;
  last_menstrual_period: string | null;
  estimated_due_date: string | null;
  gestational_weeks: number | null;
  ultrasound_notes: string | null;
  image_url: string | null;
}

export interface DentalRecord {
  id: string;
  medical_record_id: string;
  tooth_number: number;
  condition: string | null;
  surface: string | null;
  estimated_budget: number | null;
}

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  vitals: Record<string, unknown> | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: UserSummary;
  patient: PatientSummary;
  gynoRecord: GynoRecord | null;
  dentalRecords: DentalRecord[];
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  hacienda_consecutive: string | null;
  numeric_key: string | null;
  total_amount: number;
  service_description: string | null;
  hacienda_status: HaciendaStatus;
  payment_status: PaymentStatus;
  pdf_url: string | null;
  xml_url: string | null;
  createdAt: string;
  updatedAt: string;
  patient: PatientSummary;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface KPIs {
  appointments_today: number;
  new_patients_this_month: number;
  revenue_this_month: number;
}

export interface RevenueDataPoint {
  date: string;
  total: number;
}

// ─── Booking (Public) ─────────────────────────────────────────────────────────

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
  doctor_id?: string | null;
}

export interface AvailableSlotsResponse {
  date: string;
  doctor_id: string;
  slots: TimeSlot[];
}

export interface CreateBookingPayload {
  clinic_id: string;
  service_id: string;
  doctor_id: string;
  date: string;
  time: string;
  first_name: string;
  last_name: string;
  identification: string;
  whatsapp_phone?: string;
}

export interface BookingConfirmation {
  id: string;
  status: AppointmentStatus;
  start_time: string;
  end_time: string;
  reason: string | null;
  service: { name: string } | null;
  doctor: { first_name: string; last_name: string };
}

// ─── Portal ───────────────────────────────────────────────────────────────────

export interface PatientLoginPayload {
  identification: string;
  password: string;
  clinic_id: string;
}

export interface PatientLoginResponse {
  access_token: string;
  patient: { id: string; first_name: string; last_name: string };
}

// ─── Time Block ───────────────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  doctor_id: string;
  clinic_id: string;
  start_time: string; // ISO UTC
  end_time: string;   // ISO UTC
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: UserSummary;
}

export interface CreateTimeBlockPayload {
  doctor_id: string;
  start_time: string; // ISO UTC
  end_time: string;   // ISO UTC
  reason?: string;
}

// ─── Appointment Updates ──────────────────────────────────────────────────────

export interface UpdateAppointmentPayload {
  start_time?: string;
  end_time?: string;
  reason?: string;
  status?: AppointmentStatus;
}
