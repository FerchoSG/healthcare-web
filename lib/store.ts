"use client";

import type { MeResponse, ClinicMembershipInfo } from "@/types/api";
import { Role as ApiRole } from "@/types/api";

export type Role = "admin" | "receptionist" | "doctor";

export type AuthRole = "ADMIN" | "STAFF" | "DOCTOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  membership: ClinicMembershipInfo | null;
}

export const AUTH_ROLE_TO_ROLE: Record<string, Role> = {
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
  admin: "Admin",
  receptionist: "Receptionist",
  doctor: "Doctor",
};

/** Build an AuthUser from the GET /auth/me response */
export function meToAuthUser(me: MeResponse): AuthUser {
  const membership = me.active_membership;
  return {
    id: me.id,
    name: `${me.first_name} ${me.last_name}`,
    email: me.email,
    role: (membership?.role ?? ApiRole.ADMIN) as AuthRole,
    membership,
  };
}

export type View =
  | "dashboard"
  | "calendar"
  | "patients"
  | "billing"
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

export interface Prescription {
  id: string;
  patientName: string;
  medications: Medication[];
  date: string;
  doctorName: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  avatarInitials: string;
  avatarColor: string;
  lastVisit: string;
  status: "Active" | "Inactive" | "Pending";
  nextAppointment?: string;
  phone: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  reason: string;
  doctorName: string;
  status: "Pending" | "Waiting" | "In Consultation" | "Completed" | "Cancelled";
  avatarInitials: string;
  avatarColor: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  service: string;
  amount: number;
  date: string;
  haciendaStatus: "Accepted" | "Rejected" | "Draft" | "Pending";
  paymentStatus: "Paid" | "Unpaid" | "Partial";
}

export const PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Stacey Mitchell",
    age: 34,
    avatarInitials: "SM",
    avatarColor: "#FF6B6B",
    lastVisit: "Dec 12",
    status: "Active",
    phone: "+1 555-0101",
    reason: "Routine Cleaning",
    nextAppointment: "Today 09:00",
  },
  {
    id: "p2",
    name: "Oliver Chen",
    age: 28,
    avatarInitials: "OC",
    avatarColor: "#4ECDC4",
    lastVisit: "Dec 10",
    status: "Active",
    phone: "+1 555-0102",
    reason: "Crown Fitting",
    nextAppointment: "Today 10:30",
  },
  {
    id: "p3",
    name: "Sarah Kim",
    age: 45,
    avatarInitials: "SK",
    avatarColor: "#45B7D1",
    lastVisit: "Nov 28",
    status: "Active",
    phone: "+1 555-0103",
    reason: "Root Canal",
    nextAppointment: "Today 11:00",
  },
  {
    id: "p4",
    name: "James Wilson",
    age: 52,
    avatarInitials: "JW",
    avatarColor: "#96CEB4",
    lastVisit: "Nov 15",
    status: "Inactive",
    phone: "+1 555-0104",
    reason: "Check-up",
  },
  {
    id: "p5",
    name: "Maya Patel",
    age: 31,
    avatarInitials: "MP",
    avatarColor: "#FFEAA7",
    lastVisit: "Dec 5",
    status: "Active",
    phone: "+1 555-0105",
    reason: "Teeth Whitening",
    nextAppointment: "Today 14:00",
  },
  {
    id: "p6",
    name: "Carlos Rivera",
    age: 38,
    avatarInitials: "CR",
    avatarColor: "#DDA0DD",
    lastVisit: "Dec 8",
    status: "Pending",
    phone: "+1 555-0106",
    reason: "Implant Consult",
  },
];

export const APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    patientName: "Stacey Mitchell",
    time: "09:00",
    date: "2026-03-12",
    reason: "Routine Cleaning",
    doctorName: "Dr. Carlos",
    status: "In Consultation",
    avatarInitials: "SM",
    avatarColor: "#FF6B6B",
  },
  {
    id: "a2",
    patientId: "p2",
    patientName: "Oliver Chen",
    time: "10:30",
    date: "2026-03-12",
    reason: "Crown Fitting",
    doctorName: "Dr. Carlos",
    status: "Waiting",
    avatarInitials: "OC",
    avatarColor: "#4ECDC4",
  },
  {
    id: "a3",
    patientId: "p3",
    patientName: "Sarah Kim",
    time: "11:00",
    date: "2026-03-12",
    reason: "Root Canal",
    doctorName: "Dr. Martinez",
    status: "Pending",
    avatarInitials: "SK",
    avatarColor: "#45B7D1",
  },
  {
    id: "a4",
    patientId: "p5",
    patientName: "Maya Patel",
    time: "14:00",
    date: "2026-03-12",
    reason: "Teeth Whitening",
    doctorName: "Dr. Carlos",
    status: "Pending",
    avatarInitials: "MP",
    avatarColor: "#FFEAA7",
  },
  {
    id: "a5",
    patientId: "p4",
    patientName: "James Wilson",
    time: "15:30",
    date: "2026-03-12",
    reason: "Check-up",
    doctorName: "Dr. Martinez",
    status: "Pending",
    avatarInitials: "JW",
    avatarColor: "#96CEB4",
  },
  {
    id: "a6",
    patientId: "p6",
    patientName: "Carlos Rivera",
    time: "16:00",
    date: "2026-03-12",
    reason: "Implant Consult",
    doctorName: "Dr. Carlos",
    status: "Pending",
    avatarInitials: "CR",
    avatarColor: "#DDA0DD",
  },
];

export const INVOICES: Invoice[] = [
  {
    id: "INV-001",
    patientName: "Stacey Mitchell",
    service: "Routine Cleaning",
    amount: 180,
    date: "2026-03-10",
    haciendaStatus: "Accepted",
    paymentStatus: "Paid",
  },
  {
    id: "INV-002",
    patientName: "Oliver Chen",
    service: "Crown Fitting",
    amount: 1200,
    date: "2026-03-11",
    haciendaStatus: "Accepted",
    paymentStatus: "Paid",
  },
  {
    id: "INV-003",
    patientName: "Sarah Kim",
    service: "Root Canal",
    amount: 950,
    date: "2026-03-11",
    haciendaStatus: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "INV-004",
    patientName: "James Wilson",
    service: "Check-up & X-Ray",
    amount: 250,
    date: "2026-03-08",
    haciendaStatus: "Rejected",
    paymentStatus: "Unpaid",
  },
  {
    id: "INV-005",
    patientName: "Maya Patel",
    service: "Teeth Whitening",
    amount: 350,
    date: "2026-03-09",
    haciendaStatus: "Draft",
    paymentStatus: "Partial",
  },
  {
    id: "INV-006",
    patientName: "Carlos Rivera",
    service: "Implant Consult",
    amount: 120,
    date: "2026-03-07",
    haciendaStatus: "Accepted",
    paymentStatus: "Paid",
  },
  {
    id: "INV-007",
    patientName: "Stacey Mitchell",
    service: "Fluoride Treatment",
    amount: 80,
    date: "2026-03-05",
    haciendaStatus: "Accepted",
    paymentStatus: "Paid",
  },
];

export const BAR_CHART_DATA = [
  { month: "Aug", value: 42000 },
  { month: "Sep", value: 58000 },
  { month: "Oct", value: 51000 },
  { month: "Nov", value: 73000 },
  { month: "Dec", value: 102000, highlight: true },
  { month: "Jan", value: 89000 },
  { month: "Feb", value: 94000 },
];

export const LINE_CHART_DATA = [
  { month: "Aug", revenue: 42000, patients: 320 },
  { month: "Sep", revenue: 58000, patients: 410 },
  { month: "Oct", revenue: 51000, patients: 380 },
  { month: "Nov", revenue: 73000, patients: 490 },
  { month: "Dec", revenue: 102000, patients: 620 },
  { month: "Jan", revenue: 89000, patients: 540 },
  { month: "Feb", revenue: 94000, patients: 580 },
];

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-001",
    patientName: "Stacey Mitchell",
    medications: [
      {
        id: "m1",
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "3x daily for 7 days",
      },
      {
        id: "m2",
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Every 8 hours as needed",
      },
    ],
    date: "2026-03-12",
    doctorName: "Dr. Carlos",
  },
  {
    id: "rx-002",
    patientName: "Oliver Chen",
    medications: [
      {
        id: "m3",
        name: "Chlorhexidine Rinse",
        dosage: "0.12%",
        frequency: "2x daily for 14 days",
      },
    ],
    date: "2026-03-11",
    doctorName: "Dr. Carlos",
  },
];

export const PATIENT_PORTAL_DATA = {
  patient: {
    name: "Stacey Mitchell",
    identification: "1-0234-0567",
  },
  upcomingAppointment: {
    date: "Thursday, March 12, 2026",
    time: "09:00 AM",
    doctor: "Dr. Carlos Mendez",
    reason: "Routine Cleaning",
    location: "CitaBox Clinic, San José",
  },
  prescriptions: [
    {
      id: "rx-001",
      date: "Mar 12, 2026",
      doctor: "Dr. Carlos",
      medications: 2,
      summary: "Amoxicillin, Ibuprofen",
    },
    {
      id: "rx-002",
      date: "Mar 5, 2026",
      doctor: "Dr. Carlos",
      medications: 1,
      summary: "Chlorhexidine Rinse",
    },
  ],
  pastAppointments: [
    {
      date: "Dec 12, 2025",
      doctor: "Dr. Carlos",
      reason: "Root Canal",
      status: "Completed",
    },
    {
      date: "Nov 15, 2025",
      doctor: "Dr. Martinez",
      reason: "Check-up",
      status: "Completed",
    },
  ],
};
