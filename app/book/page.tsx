"use client"

import { useState } from "react"
import { WelcomeLandingPage } from "@/components/booking/WelcomeLandingPage"
import { PatientBookingWizard } from "@/components/booking/PatientBookingWizard"

type AppView = "welcome" | "wizard"

export default function BookPage() {
  const [view, setView] = useState<AppView>("welcome")

  if (view === "welcome") {
    return <WelcomeLandingPage onBook={() => setView("wizard")} />
  }

  return <PatientBookingWizard onHome={() => setView("welcome")} />
}
