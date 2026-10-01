"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
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
  getClinicNowDate,
} from "@/lib/clinic-time"
import type { Appointment, AppointmentStatus, Patient } from "@/types/api"
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

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  WAITING: "bg-violet-50 text-violet-700",
  IN_CONSULTATION: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
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

  const newThisMonth = useMemo(() => {
    const monthAgo = getClinicNowDate().getTime() - 30 * 24 * 60 * 60 * 1000
    return patients.filter((patient) => new Date(patient.createdAt).getTime() >= monthAgo).length
  }, [patients])

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
    if (!phone) return "Sin telefono"
    return phone.startsWith("+506") ? phone : `+506 ${phone}`
  }

  const renderAppointments = (patientId: string) => {
    const state = appointmentMap[patientId]

    if (!state || state.loading) {
      return (
        <div className="flex items-center gap-2 px-5 py-5 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          Cargando historial de citas...
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex items-center justify-between gap-3 px-5 py-5 text-sm text-rose-600">
          <span>{state.error}</span>
          <button
            onClick={() => loadAppointments(patientId)}
            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Reintentar
          </button>
        </div>
      )
    }

    if (state.items.length === 0) {
      return (
        <div className="px-5 py-5 text-sm text-slate-500">
          Este paciente todavia no tiene citas registradas.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3">Doctor</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.items.map((appointment) => (
              <tr key={appointment.id} className="bg-white">
                <td className="px-5 py-3 font-medium text-slate-700">
                  {formatLocalDateTime(appointment.start_time)}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {appointment.service?.name ?? appointment.reason ?? "Cita"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[appointment.status]}`}>
                    {appointment.status}
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
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-[24px] bg-white/35 p-1 lg:p-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Pacientes registrados", value: String(total) },
          { label: "Pagina actual", value: `${page}/${totalPages}` },
          { label: "Nuevos en pantalla", value: String(newThisMonth) },
        ].map((card) => (
          <div key={card.label} className="citabox-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="citabox-panel">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Pacientes</h2>
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
              className="w-full rounded-[14px] border border-border bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition focus:border-[var(--brand-navy)] focus:bg-white focus:ring-4 focus:ring-[var(--brand-navy-soft)]"
            />
          </label>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Cargando pacientes...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-rose-600">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div className="px-5 py-16 text-center text-sm text-slate-500">
            No hay pacientes que coincidan con la busqueda actual.
          </div>
        )}

        {!loading && !error && patients.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[var(--surface-soft)] text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3">Identificacion</th>
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
                        <tr key={patient.id} className="bg-white/80 align-top transition-colors hover:bg-[var(--surface-soft)]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
                                <UserRound size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">
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
                                 className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-[var(--brand-navy-soft)]"
                              >
                                <CalendarDays size={14} />
                                Historial de citas
                                <ChevronDown size={14} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
                              </button>
                              {onOpenEMR && (
                                <button
                                  onClick={() => onOpenEMR(patient.id)}
                                   className="citabox-primary-gradient inline-flex items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-bold text-white hover:brightness-95"
                                >
                                  <FileText size={14} />
                                  Ver expediente
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-[var(--surface-soft)]/80">
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
                  className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="rounded-[12px] bg-[var(--brand-navy-soft)] px-3 py-2 text-sm font-bold text-[var(--brand-navy)]">
                  Pagina {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
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
