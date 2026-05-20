import { APIRequestContext, expect, test } from "@playwright/test";
import {
  API_URL,
  authHeaders,
  createQaAppointment,
  createQaPatient,
  getCostaRicaDateKey,
  getPublicDoctors,
  loginByApi,
  loginInUi,
} from "./helpers";

async function findFreeDoctorSlot(
  request: APIRequestContext,
  session: Awaited<ReturnType<typeof loginByApi>>,
  doctorId: string,
  dateKey: string,
) {
  const response = await request.get(`${API_URL}/appointments?date=${dateKey}`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    expect(response.ok(), await response.text()).toBeTruthy();
  }
  const appointments = await response.json();

  for (const hour of [20, 21, 22, 23]) {
    for (const minute of [0, 10, 20, 30, 40, 50]) {
      const start = new Date(`${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-06:00`);
      const end = new Date(start.getTime() + 5 * 60 * 1000);
      const overlaps = appointments.some((appointment: { doctor_id: string; start_time: string; end_time: string; status: string }) => {
        if (appointment.doctor_id !== doctorId || appointment.status === "CANCELLED") return false;
        return new Date(appointment.start_time) < end && new Date(appointment.end_time) > start;
      });
      if (!overlaps) return { startTime: start.toISOString(), endTime: end.toISOString() };
    }
  }

  throw new Error("No hay espacios libres para crear la cita QA del doctor.");
}

test.describe("QA funcional - operaciones internas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("A3/P1 busca pacientes y abre historial de citas sin error de ruta", async ({ page, request }) => {
    const session = await loginByApi(request);
    const unique = Date.now();
    const patient = await createQaPatient(request, session, {
      firstName: "QA",
      lastName: `Historial ${unique}`,
      identification: `QA-HIST-${unique}`,
    });

    await loginInUi(page, "admin@clinica.cr", "admin123");
    await page.getByRole("button", { name: "Pacientes" }).click();
    await page.getByPlaceholder("Buscar paciente por nombre o cedula").fill(patient.identification);

    const patientRow = page.getByRole("row", { name: new RegExp(patient.identification) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: "Historial de citas" }).click();
    await expect(page.getByText("Cannot GET /patients")).toHaveCount(0);
    await expect(page.locator("body")).toContainText(/Historial|No tiene citas|Citas/);
  });

  test("A4 crea cita con paciente nuevo sin exigir cambiar fecha, hora o doctor por defecto", async ({ page }) => {
    const unique = Date.now();
    const firstName = "QA";
    const lastName = `Cita ${unique}`;
    const identification = `QA-CITA-${unique}`;

    await loginInUi(page, "admin@clinica.cr", "admin123");
    await page.getByRole("button", { name: /Crear/ }).click();
    await page.getByRole("menuitem", { name: "Nueva cita" }).click();

    const dialog = page.getByRole("dialog", { name: "Nueva cita" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Nuevo paciente" }).click();
    await expect(dialog.getByText("Crear paciente para esta cita")).toBeVisible();
    await expect(dialog.getByText("Maria Gonzalez")).toHaveCount(0);

    await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(firstName);
    await dialog.getByRole("textbox", { name: "Apellido", exact: true }).fill(lastName);
    await dialog.getByPlaceholder(/Identificaci/i).fill(identification);
    await dialog.getByPlaceholder("WhatsApp").fill("88881234");
    await dialog.locator('input[type="date"]').first().fill("1990-01-01");
    await dialog.getByRole("button", { name: "Crear y seleccionar paciente" }).click();

    await expect(dialog.getByText(`Seleccionado: ${firstName} ${lastName}`)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Guardar cita" })).toBeEnabled();
    const futureDay = String((unique % 20) + 1).padStart(2, "0");
    await dialog.locator('input[type="date"]').fill(`2026-07-${futureDay}`);
    await dialog.locator("select").last().selectOption("16:30");
    await dialog.getByPlaceholder("Describe el motivo de la cita").fill("QA cita desde modal");
    await dialog.getByRole("button", { name: "Guardar cita" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Pacientes" }).click();
    await page.getByPlaceholder("Buscar paciente por nombre o cedula").fill(identification);
    await expect(page.getByText(identification)).toBeVisible();
  });

  test("D2 mantiene consulta activa al iniciar, recargar y abrir expediente", async ({ page, request }) => {
    const session = await loginByApi(request);
    const doctors = await getPublicDoctors(request, session.clinicId);
    const carlos = doctors.find((doctor: { first_name: string }) => doctor.first_name === "Carlos");
    expect(carlos).toBeTruthy();

    const unique = Date.now();
    const patient = await createQaPatient(request, session, {
      firstName: "QA",
      lastName: `Consulta ${unique}`,
      identification: `QA-CONS-${unique}`,
    });

    const dateKey = getCostaRicaDateKey();
    const { startTime, endTime } = await findFreeDoctorSlot(request, session, carlos.id, dateKey);
    await createQaAppointment(request, session, {
      patientId: patient.id,
      doctorId: carlos.id,
      startTime,
      endTime,
      reason: "QA consulta activa",
    });

    await loginInUi(page, "doctor@clinica.cr", "doctor123");
    const card = page.locator(".citabox-card").filter({ hasText: `QA Consulta ${unique}` });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Iniciar consulta" }).click();
    await expect(card.getByRole("button", { name: "Finalizar consulta" })).toBeVisible();

    await page.reload();
    const reloadedCard = page.locator(".citabox-card").filter({ hasText: `QA Consulta ${unique}` });
    await expect(reloadedCard.getByRole("button", { name: "Finalizar consulta" })).toBeVisible();
    await reloadedCard.getByRole("button", { name: "Abrir expediente" }).click();
    await expect(page.getByRole("heading", { name: `QA Consulta ${unique}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar expediente" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalizar consulta" }).last()).toBeVisible();
  });

  test("A2 muestra configuracion de equipo y acciones administrativas", async ({ page }) => {
    await loginInUi(page, "admin@clinica.cr", "admin123");
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.getByRole("tab", { name: "Equipo" }).click();

    await expect(page.getByRole("button", { name: "Agregar usuario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Eliminar" }).first()).toBeVisible();
  });
});
