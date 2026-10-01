import { redirect } from "next/navigation"

export default function BookPage() {
  redirect(`/book/${process.env.DEFAULT_BOOKING_CLINIC_SLUG ?? "clinica-demo"}`)
}
