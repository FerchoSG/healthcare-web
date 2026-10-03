import { expect, test } from "@playwright/test";
import { loginInUi } from "./helpers";

test.describe("QA funcional - autenticacion por rol", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test("A1 login admin carga el panel administrativo", async ({ page }) => {
    await loginInUi(page, "admin@clinica.cr", (process.env.E2E_ADMIN_PASSWORD ?? "admin123"));
    await expect(page.getByRole("heading", { name: "Actividad de la clínica" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hoy", exact: true })).toBeVisible();
  });

  test("S1 login staff carga recepcion sin romper billing", async ({ page }) => {
    await loginInUi(page, "staff@clinica.cr", (process.env.E2E_STAFF_PASSWORD ?? "staff123"));
    await expect(page.locator("body")).toContainText(/Recepción|Agenda de hoy|Cola/);
    await expect(page.getByText("Cannot GET /billing/invoices")).toHaveCount(0);
  });

  test("D1 login doctor carga agenda del dia", async ({ page }) => {
    await loginInUi(page, "doctor@clinica.cr", (process.env.E2E_DOCTOR_PASSWORD ?? "doctor123"));
    await expect(page.locator("body")).toContainText(/Agenda|consulta|Paciente/);
    await expect(page.getByText("Cannot read properties of undefined")).toHaveCount(0);
  });
});
