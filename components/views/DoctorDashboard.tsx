"use client"
import { appointmentStatusClass, appointmentStatusLabel } from "@/lib/design"


import { useState, useEffect, useCallback } from "react"
import { CITABOX_DATA_CHANGED_EVENT } from "@/lib/data-events"
import { formatClinicTime, formatClinicDateFromKey, getClinicTodayKey } from "@/lib/clinic-time"
import { AppointmentStatus, type Appointment } from "@/types/api"
import { fetchTodayAppointments, updateAppointmentStatus } from "@/services/appointments.service"
import { useToast } from "@/hooks/use-toast"
import { Clock, FileText, Loader2, AlertCircle } from "lucide-react"

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function getAvatarColor(_name: string) { return "var(--ds-action)" }

function formatTime(isoString: string) {
  return formatClinicTime(isoString)
}

interface DoctorDashboardProps {
  onOpenEMR: (patientId: string, options?: { consultationActive?: boolean; appointmentId?: string }) => void
  doctorId?: string
  doctorName?: string
}

export function DoctorDashboard({ onOpenEMR, doctorId, doctorName }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeConsultId, setActiveConsultId] = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTodayAppointments()
      // Filter to this doctor's appointments if doctorId is known
      const mine = doctorId ? data.filter((a) => a.doctor_id === doctorId) : data
      setAppointments(mine)
      const inConsultation = mine.find((appointment) => appointment.status === AppointmentStatus.IN_CONSULTATION)
      setActiveConsultId(inConsultation?.id ?? null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las citas.")
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  useEffect(() => {
    const handler = () => {
      void loadAppointments()
    }
    window.addEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
  }, [loadAppointments])

  const handleStartConsultation = async (apt: Appointment) => {
    if (apt.status !== AppointmentStatus.IN_CONSULTATION) {
      setMutatingId(apt.id)
      try {
        const updated = await updateAppointmentStatus(apt.id, AppointmentStatus.IN_CONSULTATION)
        setActiveConsultId(apt.id)
        setAppointments((a) => a.map((x) => (x.id === apt.id ? { ...x, ...updated } : x)))
        if (!updated.patient || !updated.doctor) {
          await loadAppointments()
        }
      } catch (err: unknown) {
        setActiveConsultId((current) => (current === apt.id ? null : current))
        toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "No se pudo iniciar la consulta" })
      } finally {
        setMutatingId(null)
      }
    } else {
      setActiveConsultId(apt.id)
    }
  }

  const handleEndConsultation = async (apt: Appointment) => {
    setActiveConsultId(null)
    setMutatingId(apt.id)
    try {
      const updated = await updateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)
      setAppointments((a) => a.map((x) => (x.id === apt.id ? { ...x, ...updated } : x)))
      if (!updated.patient || !updated.doctor) {
        await loadAppointments()
      }
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "No se pudo cerrar la consulta" })
    } finally {
      setMutatingId(null)
    }
  }

  const displayName = doctorName ?? "Doctor"
  const todayStr = formatClinicDateFromKey(getClinicTodayKey(), {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const activeCount = appointments.filter((appointment) => appointment.status === AppointmentStatus.IN_CONSULTATION).length

  const statusBadge = (status: AppointmentStatus, _isActive: boolean) => ({ cls: appointmentStatusClass(status), style: {}, label: appointmentStatusLabel(status) })

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-md bg-transparent">
      <div>
        <p className="text-sm text-muted-foreground">{todayStr}</p>
        <h2 className="mt-1 text-2xl font-semibold">Agenda de hoy</h2>
        <p className="mt-1 text-sm text-muted-foreground">{displayName} · {appointments.length} citas programadas</p>
      </div>
      <div className="metric-strip metrics-three">
        {[
          { label: "Pacientes de hoy", value: appointments.length },
          { label: "En consulta", value: activeCount },
          { label: "Completadas", value: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length },
        ].map(stat => <div key={stat.label}><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "…" : stat.value}</p></div>)}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando agenda...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-8 justify-center text-danger">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button onClick={loadAppointments} className="text-sm font-semibold underline ml-2">Reintentar</button>
        </div>
      )}

      {/* Appointment Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {appointments.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No hay citas para hoy.</p>
          )}
          {appointments.map((apt) => {
            const patientFirstName = apt.patient?.first_name ?? "Paciente"
            const patientLastName = apt.patient?.last_name ?? ""
            const name = `${patientFirstName} ${patientLastName}`.trim()
            const initials = getInitials(patientFirstName, patientLastName || "P")
            const color = getAvatarColor(name)
            const isActive = activeConsultId === apt.id || apt.status === AppointmentStatus.IN_CONSULTATION
            const isMutating = mutatingId === apt.id
            const badge = statusBadge(apt.status, isActive)

            return (
              <div
                key={apt.id}
                className={`citabox-card flex flex-col gap-3 p-5 transition-all ${
                  isActive ? "ring-2 ring-[var(--ds-action)]" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md text-xs font-semibold text-primary-foreground"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{apt.patient?.identification ?? ""}</p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls}`}
                    style={badge.style}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatTime(apt.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={11} />
                        {apt.reason ?? apt.service?.name ?? "Cita"}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-1">
                  {isActive ? (
                    <>
                      <button
                        onClick={() => onOpenEMR(apt.patient_id, { consultationActive: true, appointmentId: apt.id })}
                        className="flex-1 rounded-md border-2 py-2.5 text-xs font-semibold transition-all hover:bg-[var(--ds-action-soft)]"
                        style={{ borderColor: "var(--ds-action)", color: "var(--ds-action)" }}
                      >
                        Abrir expediente
                      </button>
                      <button
                        onClick={() => handleEndConsultation(apt)}
                        disabled={isMutating}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary disabled:opacity-60"
                      >
                        {isMutating && <Loader2 size={12} className="animate-spin" />}
                        Finalizar consulta
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartConsultation(apt)}
                      disabled={isMutating || apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CANCELLED}
                      className="citabox-action flex w-full items-center justify-center gap-1 rounded-md py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-60"
                    >
                      {isMutating && <Loader2 size={12} className="animate-spin" />}
                      Iniciar consulta
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
