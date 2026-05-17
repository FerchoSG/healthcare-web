export const CLINIC_TYPE_OPTIONS = [
  { value: "GENERAL_MEDICINE", label: "Medicina general" },
  { value: "DENTAL", label: "Odontología" },
  { value: "GYNECOLOGY", label: "Ginecología" },
  { value: "PEDIATRICS", label: "Pediatría" },
  { value: "DERMATOLOGY", label: "Dermatología" },
  { value: "PSYCHOLOGY", label: "Psicología" },
  { value: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { value: "OTHER", label: "Otra especialidad" },
] as const;

export const SPECIALTY_MODULE_OPTIONS = [
  { value: "GENERAL_MEDICINE", label: "Notas clínicas" },
  { value: "DENTAL", label: "Odontograma" },
  { value: "GYNECOLOGY", label: "Ginecología" },
  { value: "PRESCRIPTIONS", label: "Recetas" },
] as const;

export type ClinicType = (typeof CLINIC_TYPE_OPTIONS)[number]["value"];
export type SpecialtyModule = (typeof SPECIALTY_MODULE_OPTIONS)[number]["value"];

export function getClinicTypeLabel(type?: string | null) {
  return CLINIC_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Medicina general";
}

export function defaultModulesForClinicType(type: ClinicType): SpecialtyModule[] {
  const modules = new Set<SpecialtyModule>(["GENERAL_MEDICINE", "PRESCRIPTIONS"]);
  if (type === "DENTAL") modules.add("DENTAL");
  if (type === "GYNECOLOGY") modules.add("GYNECOLOGY");
  return [...modules];
}
