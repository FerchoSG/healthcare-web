import { expect, test } from "@playwright/test";
import {
  API_URL,
  authHeaders,
  clinicDateTimeToUtc,
  createQaAppointment,
  getPublicDoctors,
  loginByApi,
} from "./helpers";
import {
  clinicLocalDateTimeToIso,
  formatClinicDateTime,
  formatClinicTime,
  getClinicLocalParts,
  getClinicLocalSlot,
  shiftClinicDateKey,
} from "../../lib/clinic-time";

test.describe("Timezone Costa Rica end-to-end", () => {
  test("TZ-FE convierte y formatea horas de Costa Rica de forma estable", () => {
    const lateNightUtc = "2026-08-05T05:30:00.000Z";

    expect(getClinicLocalParts(lateNightUtc).dateKey).toBe("2026-08-04");
    expect(getClinicLocalParts(lateNightUtc).timeKey).toBe("23:30");
    expect(getClinicLocalSlot(lateNightUtc).timeKey).toBe("23:30");
    expect(getClinicLocalSlot("2026-08-05T05:46:00.000Z").dateKey).toBe("2026-08-05");
    expect(getClinicLocalSlot("2026-08-05T05:46:00.000Z").timeKey).toBe("00:00");
    expect(formatClinicTime(lateNightUtc)).toBe("23:30");
    expect(
      formatClinicDateTime(lateNightUtc, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    ).toContain("23:30");
    expect(clinicLocalDateTimeToIso("2026-08-04", "23:30")).toBe(lateNightUtc);
    expect(clinicDateTimeToUtc("2026-08-04", "08:00")).toBe("2026-08-04T14:00:00.000Z");
    expect(shiftClinicDateKey("2026-08-04", 1)).toBe("2026-08-05");
  });

  test("TZ-E2E consulta citas por dia de clinica aunque el UTC sea el dia siguiente", async ({ request }) => {
    const session = await loginByApi(request);
    const doctors = await getPublicDoctors(request, session.clinicId);
    const doctor = doctors.find((item: { first_name: string }) => item.first_name === "Carlos");
    expect(doctor).toBeTruthy();

    const patients = await request.get(`${API_URL}/patients?limit=1`, {
      headers: authHeaders(session),
    });
    expect(patients.ok(), await patients.text()).toBeTruthy();
    const patient = (await patients.json()).data[0];
    const uniqueSecond = String(Date.now() % 60).padStart(2, "0");
    const start = `2026-08-05T05:30:${uniqueSecond}.000Z`;
    const end = new Date(new Date(start).getTime() + 30_000).toISOString();

    const appointment = await createQaAppointment(request, session, {
      patientId: patient.id,
      doctorId: doctor.id,
      startTime: start,
      endTime: end,
      reason: "QA timezone frontend",
    });

    try {
      const clinicDay = await request.get(`${API_URL}/appointments?date=2026-08-04`, {
        headers: authHeaders(session),
      });
      expect(clinicDay.ok(), await clinicDay.text()).toBeTruthy();
      expect((await clinicDay.json()).some((item: { id: string }) => item.id === appointment.id)).toBe(true);

      const nextUtcDay = await request.get(`${API_URL}/appointments?date=2026-08-05`, {
        headers: authHeaders(session),
      });
      expect(nextUtcDay.ok(), await nextUtcDay.text()).toBeTruthy();
      expect((await nextUtcDay.json()).some((item: { id: string }) => item.id === appointment.id)).toBe(false);
    } finally {
      await request.delete(`${API_URL}/appointments/${appointment.id}`, {
        headers: authHeaders(session),
      });
    }
  });
});
