import type { AppointmentEmailResult } from "@/types/api"

export function isValidOptionalEmail(value: string) {
  const email = value.trim()
  return !email || (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}

export function appointmentEmailMessage(result?: AppointmentEmailResult) {
  if (result?.status === "sent") return "Enviamos un comprobante al correo indicado. Revisa también la carpeta de spam."
  if (result?.status === "skipped" && result.reason === "missing_email") return "No se envió correo porque no se indicó una dirección."
  if (result) return "La cita quedó registrada, pero no fue posible enviar el comprobante por correo."
  return "La cita quedó registrada."
}
