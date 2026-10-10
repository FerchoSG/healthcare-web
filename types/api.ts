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

export enum PaymentMethod {
  SINPE_MOVIL = "SINPE_MOVIL",
  TARJETA = "TARJETA",
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
}

export enum Gender {
  M = "M",
  F = "F",
  OTHER = "OTHER",
}

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
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
  clinic_slug: string;
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
  clinic_type: string;
  specialty_modules: string[];
  tax_id: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  public_phone: string | null;
  public_email: string | null;
  logo_path: string | null;
  theme_color: string | null;
  booking_enabled: boolean;
  hacienda_api_key: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicClinic {
  id: string;
  name: string;
  slug: string;
  clinic_type: string;
  specialty_modules: string[];
  phone: string | null;
  email: string | null;
  public_phone: string | null;
  public_email: string | null;
  address: string | null;
  timezone: string;
  logo_path: string | null;
  theme_color: string | null;
  booking_enabled: boolean;
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
  birth_date: string | null;
  gender: Gender | null;
  whatsapp_phone: string | null;
  email?: string | null;
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

export type AppointmentEmailResult =
  | { status: "sent"; provider_id: string }
  | { status: "skipped"; reason: "missing_email" | "resend_not_configured" }
  | { status: "failed"; reason: "email_request_failed" };

export interface Appointment {
  id: string;
  reference?: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  reminder_sent: boolean;
  email_confirmation?: AppointmentEmailResult;
  createdAt: string;
  updatedAt: string;
  patient: PatientSummary;
  doctor: UserSummary;
  service: ServiceSummary | null;
}

export interface CreateAppointmentPayload {
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  service_id?: string;
  patient_email?: string | null;
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
  prescriptions: Prescription[];
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Prescription {
  id: string;
  medical_record_id?: string;
  medications: PrescriptionMedication[];
  additional_notes: string | null;
  pdf_url: string | null;
  createdAt: string;
  updatedAt?: string;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  doctor?: UserSummary;
  medicalRecord?: {
    diagnosis: string | null;
    treatment_plan: string | null;
    doctor: UserSummary;
  };
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  hacienda_consecutive: string | null;
  numeric_key: string | null;
  total_amount: number;
  service_description: string | null;
  hacienda_status: HaciendaStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  paid_amount: number | null;
  paid_at: string | null;
  notes: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  createdAt: string;
  updatedAt: string;
  patient: PatientSummary;
  appointment?: {
    id: string;
    start_time: string;
    status: AppointmentStatus;
  } | null;
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
  clinic_id?: string;
  clinic_slug?: string;
  service_id: string;
  doctor_id: string;
  date: string;
  time: string;
  first_name: string;
  last_name: string;
  identification: string;
  whatsapp_phone?: string;
  email?: string;
}

export interface BookingConfirmation {
  reference?: string;
  email_confirmation?: AppointmentEmailResult;
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
