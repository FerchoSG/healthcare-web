import { expect, test } from "@playwright/test";

test.describe("QA funcional - portal del paciente", () => {
  test("PT1 paciente ingresa al portal y consulta citas e indicaciones", async ({ page }) => {
    await page.goto("/portal/clinica-demo");
    await page.getByPlaceholder(/Identificaci/i).fill("1-1000-0001");
    await page.getByPlaceholder(/Contrase/i).fill("Paciente123");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByRole("heading", { name: /Hola, Maria/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Citas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Indicaciones" })).toBeVisible();
  });
});
