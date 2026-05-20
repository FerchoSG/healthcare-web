import { expect, test } from "@playwright/test";
import {
  createQaService,
  getPublicDoctors,
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

    await page.getByRole("button", { name: "22", exact: true }).click();
    await expect(page.getByRole("button", { name: "08:00 AM" })).toBeVisible();
    await expect(page.getByRole("button", { name: "09:00 AM" })).toBeVisible();
    await expect(page.getByRole("button", { name: "08:30 AM" })).toHaveCount(0);

    await page.getByRole("button", { name: "08:00 AM" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    const whatsapp = page.locator("#whatsapp").filter({ visible: true });
    await whatsapp.fill("abc888812345");
    await expect(whatsapp).toHaveValue("88881234");

    await page.locator("#firstName").filter({ visible: true }).fill("QA");
    await page.locator("#lastName").filter({ visible: true }).fill("Paciente");
    await page.locator("#cedula").filter({ visible: true }).fill(`QA-UI-${Date.now()}`);
    await expect(page.getByRole("button", { name: "Revisar Cita" })).toBeEnabled();
  });
});
