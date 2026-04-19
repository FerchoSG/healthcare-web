"use client"

import { useState } from "react"
import { WelcomeLandingPage } from "@/components/booking/WelcomeLandingPage"
import { PatientBookingWizard } from "@/components/booking/PatientBookingWizard"

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID ?? ""

type AppView = "welcome" | "wizard"

export default function BookPage() {
  const [view, setView] = useState<AppView>("welcome")

  if (view === "welcome") {
    return <WelcomeLandingPage onBook={() => setView("wizard")} />
  }

  return <PatientBookingWizard clinicId={CLINIC_ID} onHome={() => setView("welcome")} />
}
