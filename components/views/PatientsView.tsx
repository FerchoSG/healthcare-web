"use client"
import { appointmentStatusClass, appointmentStatusLabel } from "@/lib/design"


import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Phone,
  Search,
  UserRound,
} from "lucide-react"
import { CITABOX_DATA_CHANGED_EVENT } from "@/lib/data-events"
import {
  formatClinicDateTime,
  getClinicAgeFromBirthDate,
} from "@/lib/clinic-time"
import type { Appointment, Patient } from "@/types/api"
import { fetchPatientAppointments, fetchPatients } from "@/services/patients.service"

interface PatientsViewProps {
  onOpenEMR?: (patientId: string) => void
}

const PAGE_SIZE = 10

type AppointmentState = {
  loading: boolean
  error: string | null
  items: Appointment[]
}


export function PatientsView({ onOpenEMR }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null)
  const [appointmentMap, setAppointmentMap] = useState<Record<string, AppointmentState>>({})

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    async function loadPatients() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchPatients({ page, limit: PAGE_SIZE, search: search || undefined })
        if (cancelled) return
        setPatients(res.data)
        setTotal(res.meta.total)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "No se pudieron cargar los pacientes.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPatients()
    return () => {
      cancelled = true
    }
  }, [page, search, reloadNonce])

  useEffect(() => {
    const handler = () => {
      setPage(1)
      setExpandedPatientId(null)
      setAppointmentMap({})
      setReloadNonce((current) => current + 1)
    }
    window.addEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))


  const loadAppointments = async (patientId: string) => {
    setAppointmentMap((prev) => ({
      ...prev,
      [patientId]: {
        loading: true,
        error: null,
        items: prev[patientId]?.items ?? [],
      },
    }))

    try {
      const items = await fetchPatientAppointments(patientId)
      setAppointmentMap((prev) => ({
        ...prev,
        [patientId]: {
          loading: false,
          error: null,
          items,
        },
      }))
    } catch (err) {
      setAppointmentMap((prev) => ({
        ...prev,
        [patientId]: {
          loading: false,
          error: err instanceof Error ? err.message : "No se pudieron cargar las citas.",
          items: prev[patientId]?.items ?? [],
        },
      }))
    }
  }

  const toggleExpanded = async (patientId: string) => {
    const isOpen = expandedPatientId === patientId
    if (isOpen) {
      setExpandedPatientId(null)
      return
    }

    setExpandedPatientId(patientId)
    if (!appointmentMap[patientId]) {
      await loadAppointments(patientId)
    }
  }

  const getAge = (birthDate: string | null) => {
    return getClinicAgeFromBirthDate(birthDate)
  }

  const formatLocalDateTime = (iso: string) =>
    formatClinicDateTime(iso)

  const formatPhone = (phone?: string | null) => {
    if (!phone) return "Sin teléfono"
    return phone.startsWith("+506") ? phone : `+506 ${phone}`
  }

  const renderAppointments = (patientId: string) => {
    const state = appointmentMap[patientId]

    if (!state || state.loading) {
      return (
        <div className="flex items-center gap-2 px-5 py-5 text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" />
          Cargando historial de citas...
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex items-center justify-between gap-3 px-5 py-5 text-sm text-danger">
          <span>{state.error}</span>
          <button
            onClick={() => loadAppointments(patientId)}
            className="rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-bg"
          >
            Reintentar
          </button>
        </div>
      )
    }

    if (state.items.length === 0) {
      return (
        <div className="px-5 py-5 text-sm text-muted-foreground">
          Este paciente todavía no tiene citas registradas.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-card text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3">Doctor</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {state.items.map((appointment) => (
              <tr key={appointment.id} className="bg-card">
                <td className="px-5 py-3 font-medium text-foreground">
                  {formatLocalDateTime(appointment.start_time)}
                </td>
                <td className="px-5 py-3 text-foreground">
                  {appointment.service?.name ?? appointment.reason ?? "Cita"}
                </td>
                <td className="px-5 py-3 text-foreground">
                  Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                    {appointmentStatusLabel(appointment.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-md bg-transparent">
      <div className="citabox-panel">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Pacientes <span className="ml-2 text-sm font-normal text-muted-foreground">{total} registrados</span></h2>
            <p className="text-sm text-muted-foreground">
              Busca por nombre o identificación, revisa su historial de citas y abre su expediente clínico.
            </p>
          </div>

          <label className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar paciente por nombre o cedula"
              aria-label="Buscar paciente por nombre o identificación"
              className="w-full rounded-md border border-input bg-[var(--ds-surface-alt)] py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition focus:border-[var(--ds-action)] focus:bg-card focus:ring-4 focus:ring-[var(--ds-action-soft)]"
            />
          </label>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            Cargando pacientes...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            No hay pacientes que coincidan con la búsqueda actual.
          </div>
        )}

        {!loading && !error && patients.length > 0 && (
          <>
            <div className="divide-y divide-border lg:hidden">
              {patients.map(patient => <article key={patient.id} className="p-4">
                <h3 className="font-semibold">{patient.first_name} {patient.last_name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{patient.identification} · {getAge(patient.birth_date) ?? "Edad no registrada"}{getAge(patient.birth_date) !== null ? " años" : ""}</p>
                <p className="mt-2 text-sm text-muted-foreground">{formatPhone(patient.whatsapp_phone)}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" aria-expanded={expandedPatientId === patient.id} onClick={() => toggleExpanded(patient.id)}>Historial de citas</Button>{onOpenEMR && <Button onClick={() => onOpenEMR(patient.id)}>Ver expediente</Button>}</div>
                {expandedPatientId === patient.id && <div className="mt-4">{renderAppointments(patient.id)}</div>}
              </article>)}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="bg-[var(--ds-surface-alt)] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3">Identificación</th>
                    <th className="px-5 py-3">Edad</th>
                    <th className="px-5 py-3">Contacto</th>
                    <th className="px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((patient) => {
                    const expanded = expandedPatientId === patient.id

                    return (
                      <Fragment key={patient.id}>
                        <tr key={patient.id} className="bg-card align-top transition-colors hover:bg-[var(--ds-surface-alt)]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--ds-action-soft)] text-[var(--ds-action)]">
                                <UserRound size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Ingreso {formatClinicDateTime(patient.createdAt, { dateStyle: "medium" })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{patient.identification}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{getAge(patient.birth_date) ?? "N/D"}</td>
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone size={14} className="text-muted-foreground" />
                              {formatPhone(patient.whatsapp_phone)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => toggleExpanded(patient.id)}
                                aria-expanded={expanded}
                                 className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-[var(--ds-action-soft)]"
                              >
                                <CalendarDays size={14} />
                                Historial de citas
                                <ChevronDown size={14} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
                              </button>
                              {onOpenEMR && (
                                <button
                                  onClick={() => onOpenEMR(patient.id)}
                                   className="citabox-action inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-95"
                                >
                                  <FileText size={14} />
                                  Ver expediente
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-[var(--ds-surface-alt)]/80">
                            <td colSpan={5} className="p-0">
                              {renderAppointments(patient.id)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} de {total} pacientes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="rounded-md bg-[var(--ds-action-soft)] px-3 py-2 text-sm font-semibold text-[var(--ds-action)]">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
