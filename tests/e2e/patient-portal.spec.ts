import { expect, test } from "@playwright/test";

test.describe("QA funcional - portal del paciente", () => {
  test("PT1 paciente ingresa al portal y consulta citas e indicaciones", async ({ page }) => {
    await page.goto("/portal/clinica-demo");
    await page.getByLabel("Identificación", { exact: true }).fill("1-1000-0001");
    await page.getByLabel("Contraseña", { exact: true }).fill((process.env.E2E_PATIENT_PASSWORD ?? "Paciente123"));
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByRole("heading", { name: /Hola, Maria/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tus citas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Indicaciones" })).toBeVisible();
  });
});
