import { api } from "@/lib/api-client";
import type { Invoice, PaymentMethod, PaymentStatus } from "@/types/api";

export interface CreateInvoicePayload {
  patient_id: string;
  appointment_id?: string;
  total_amount: number;
  service_description?: string;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  paid_amount?: number;
  paid_at?: string;
  notes?: string;
}

export interface UpdateInvoicePayload {
  appointment_id?: string;
  total_amount?: number;
  service_description?: string;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  paid_amount?: number;
  paid_at?: string | null;
  notes?: string;
}

export function fetchInvoices(): Promise<Invoice[]> {
  return api.get<Invoice[]>("/billing/invoices");
}

export function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  return api.post<Invoice>("/billing/invoices", payload);
}

export function updateInvoice(id: string, payload: UpdateInvoicePayload): Promise<Invoice> {
  return api.patch<Invoice>(`/billing/invoices/${encodeURIComponent(id)}`, payload);
}
