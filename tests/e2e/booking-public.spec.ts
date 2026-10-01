import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createQaService,
  getPublicDoctors,
  getCostaRicaDateKey,
  loginByApi,
} from "./helpers";

test.describe("QA funcional - booking publico", () => {
  test("B1 filtra servicios por medico y muestra todos con cualquiera", async ({ page, request }) => {
    const session = await loginByApi(request);
    const doctors = await getPublicDoctors(request, session.clinicId);
    const carlos = doctors.find((doctor: { first_name: string }) => doctor.first_name === "Carlos");
    const laura = doctors.find((doctor: { first_name: string }) => doctor.first_name === "Laura");
    expect(carlos).toBeTruthy();
    expect(laura).toBeTruthy();

    const serviceName = `QA Limpieza UI ${Date.now()}`;
    await createQaService(request, session, {
      name: serviceName,
      durationMinutes: 60,
      doctorId: carlos.id,
    });

    await page.goto(`/book/${session.clinicSlug}`);
    await page.getByRole("button", { name: "Empezar reserva" }).click();

    await expect(page.getByRole("button", { name: new RegExp(serviceName) })).toBeVisible();

    await page.getByRole("button", { name: "CM Carlos General" }).click();
    await expect(page.getByRole("button", { name: new RegExp(serviceName) })).toBeVisible();

    await page.getByRole("button", { name: "LM Laura Orthodontics" }).click();
    await expect(page.getByRole("button", { name: new RegExp(serviceName) })).toHaveCount(0);

    await page.getByRole("button", { name: "? Cualquiera Disponible" }).click();
    await expect(page.getByRole("button", { name: new RegExp(serviceName) })).toBeVisible();
  });

  test("B1 usa duracion de una hora y limita WhatsApp a 8 digitos", async ({ page, request }) => {
    const session = await loginByApi(request);
    const doctors = await getPublicDoctors(request, session.clinicId);
    const carlos = doctors.find((doctor: { first_name: string }) => doctor.first_name === "Carlos");
    expect(carlos).toBeTruthy();

    const serviceName = `QA Slots UI ${Date.now()}`;
    await createQaService(request, session, {
      name: serviceName,
      durationMinutes: 60,
      doctorId: carlos.id,
    });

    await page.goto(`/book/${session.clinicSlug}`);
    await page.getByRole("button", { name: "Empezar reserva" }).click();
    await page.getByRole("button", { name: "CM Carlos General" }).click();
    await page.getByRole("button", { name: new RegExp(serviceName) }).click();

    const bookingDate = new Date(`${getCostaRicaDateKey()}T12:00:00Z`);
    bookingDate.setUTCDate(bookingDate.getUTCDate() + 7);
    const dateKey = bookingDate.toISOString().slice(0, 10);
    if (bookingDate.getUTCMonth() !== new Date(`${getCostaRicaDateKey()}T12:00:00Z`).getUTCMonth()) {
      await page.getByRole("button", { name: "Mes siguiente" }).click();
    }
    await page.getByRole("button", { name: `Seleccionar ${dateKey}` }).click();
    await expect(page.getByRole("button", { name: "08:00 AM" })).toBeVisible();
    await expect(page.getByRole("button", { name: "09:00 AM" })).toBeVisible();
    await expect(page.getByRole("button", { name: "08:30 AM" })).toHaveCount(0);

    const availableHour = (await Promise.all(
      ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"].map(async (label) =>
        (await page.getByRole("button", { name: label }).isEnabled()) ? label : null,
      ),
    )).find(Boolean);
    expect(availableHour).toBeTruthy();
    await page.getByRole("button", { name: availableHour! }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    const whatsapp = page.locator("#whatsapp").filter({ visible: true });
    await whatsapp.fill("abc888812345");
    await expect(whatsapp).toHaveValue("88881234");

    await page.locator("#firstName").filter({ visible: true }).fill("QA");
    await page.locator("#lastName").filter({ visible: true }).fill("Paciente");
    await page.locator("#cedula").filter({ visible: true }).fill(`QA-UI-${Date.now()}`);
    await expect(page.getByRole("button", { name: "Revisar Cita" })).toBeEnabled();
    await page.getByRole("button", { name: "Revisar Cita" }).click();
    await page.getByRole("button", { name: "Reservar" }).click();
    await expect(page.getByRole("heading", { name: "¡Solicitud de cita recibida!" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar recordatorio" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`solicitud-cita-${dateKey}.ics`);
    const calendar = await readFile(await download.path(), "utf8");
    expect(calendar).toContain("SUMMARY:Solicitud pendiente:");
  });
});
