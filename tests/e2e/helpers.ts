import { APIRequestContext, expect, Page } from "@playwright/test";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type TestSession = {
  token: string;
  clinicId: string;
  clinicSlug: string;
};

async function expectOk(response: { ok(): boolean; text(): Promise<string> }) {
  if (!response.ok()) {
    expect(response.ok(), await response.text()).toBeTruthy();
  }
}

export async function loginByApi(
  request: APIRequestContext,
  email = "admin@clinica.cr",
  password = (process.env.E2E_ADMIN_PASSWORD ?? "admin123"),
): Promise<TestSession> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  await expectOk(response);

  const body = await response.json();
  const membership = body.memberships.find(
    (item: { clinic_slug: string }) => item.clinic_slug === "clinica-demo",
  );
  expect(membership).toBeTruthy();

  return {
    token: body.access_token,
    clinicId: membership.clinic_id,
    clinicSlug: membership.clinic_slug,
  };
}

export async function createQaService(
  request: APIRequestContext,
  session: TestSession,
  options: { name: string; durationMinutes?: number; doctorId: string },
) {
  const response = await request.post(`${API_URL}/services`, {
    headers: authHeaders(session),
    data: {
      name: options.name,
      description: "Servicio QA automatizado",
      duration_minutes: options.durationMinutes ?? 60,
      price: 25000,
      doctor_ids: [options.doctorId],
    },
  });
  await expectOk(response);
  return response.json();
}

export async function createQaPatient(
  request: APIRequestContext,
  session: TestSession,
  options: { firstName: string; lastName: string; identification: string },
) {
  const response = await request.post(`${API_URL}/patients`, {
    headers: authHeaders(session),
    data: {
      first_name: options.firstName,
      last_name: options.lastName,
      identification: options.identification,
      birth_date: "1990-01-01",
      gender: "OTHER",
      whatsapp_phone: "88880000",
    },
  });
  await expectOk(response);
  return response.json();
}

export async function createQaAppointment(
  request: APIRequestContext,
  session: TestSession,
  options: {
    patientId: string;
    doctorId: string;
    startTime: string;
    endTime: string;
    reason?: string;
    serviceId?: string;
  },
) {
  const response = await request.post(`${API_URL}/appointments`, {
    headers: authHeaders(session),
    data: {
      patient_id: options.patientId,
      doctor_id: options.doctorId,
      start_time: options.startTime,
      end_time: options.endTime,
      reason: options.reason ?? "QA appointment",
      ...(options.serviceId ? { service_id: options.serviceId } : {}),
    },
  });
  await expectOk(response);
  return response.json();
}

export async function getPublicDoctors(request: APIRequestContext, clinicId: string) {
  const response = await request.get(`${API_URL}/booking/doctors?clinic_id=${clinicId}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export function clinicDateTimeToUtc(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00-06:00`).toISOString();
}

export function getCostaRicaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function authHeaders(session: TestSession) {
  return {
    Authorization: `Bearer ${session.token}`,
    "x-clinic-id": session.clinicId,
  };
}

export async function loginInUi(
  page: Page,
  email: string,
  password: string,
  clinicName = "Clinica Demo",
) {
  await page.goto("/");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();

  const clinicButton = page.getByRole("button", {
    name: clinicName, exact: true,
  });
  if (await clinicButton.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false)) {
    await clinicButton.click();
  }
}
