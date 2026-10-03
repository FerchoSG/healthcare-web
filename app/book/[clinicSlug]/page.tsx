"use client"

import { use, useEffect, useState } from "react"
import { WelcomeLandingPage } from "@/components/booking/WelcomeLandingPage"
import { PatientBookingWizard } from "@/components/booking/PatientBookingWizard"
import { getPublicClinic } from "@/services/booking.service"
import type { PublicClinic } from "@/types/api"

type AppView = "welcome" | "wizard"

export default function ClinicBookPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>
}) {
  const { clinicSlug } = use(params)
  const [view, setView] = useState<AppView>("welcome")
  const [initialServiceId, setInitialServiceId] = useState("")
  const [clinic, setClinic] = useState<PublicClinic | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPublicClinic(clinicSlug)
      .then((data) => {
        if (!cancelled) setClinic(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se encontró la clínica")
      })
    return () => {
      cancelled = true
    }
  }, [clinicSlug])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="bg-card border border-border rounded-lg  p-6 max-w-md text-center">
          <h1 className="text-lg font-semibold text-foreground">Clínica no disponible</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-transparent" />
      </div>
    )
  }

  return (
    <div data-light-only="true">
      {view === "welcome" ? (
        <WelcomeLandingPage clinic={clinic} onBook={(id) => { setInitialServiceId(id ?? ""); setView("wizard") }} />
      ) : (
        <PatientBookingWizard initialServiceId={initialServiceId} clinicId={clinic.id} clinic={clinic} onHome={() => setView("welcome")} />
      )}
    </div>
  )
}
