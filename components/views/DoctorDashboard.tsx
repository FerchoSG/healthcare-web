"use client"

import { useState, useEffect, useCallback } from "react"
import { CITABOX_DATA_CHANGED_EVENT } from "@/lib/data-events"
import { formatClinicTime, formatClinicDateFromKey, getClinicTodayKey } from "@/lib/clinic-time"
import { AppointmentStatus, type Appointment } from "@/types/api"
import { fetchTodayAppointments, updateAppointmentStatus } from "@/services/appointments.service"
import { useToast } from "@/hooks/use-toast"
import { Stethoscope, Clock, User, FileText, Loader2, AlertCircle } from "lucide-react"

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function getAvatarColor(name: string) {
  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#74b9ff", "#fd79a8"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

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

  const statusBadge = (status: AppointmentStatus, isActive: boolean) => {
    if (isActive) return { cls: "text-white", style: { backgroundColor: "var(--neon-green)" }, label: "Activa" }
    switch (status) {
      case AppointmentStatus.WAITING: return { cls: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300", style: {}, label: "En espera" }
      case AppointmentStatus.COMPLETED: return { cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300", style: {}, label: "Completada" }
      case AppointmentStatus.IN_CONSULTATION: return { cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300", style: {}, label: "En consulta" }
      case AppointmentStatus.CANCELLED: return { cls: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300", style: {}, label: "Cancelada" }
      default: return { cls: "text-muted-foreground bg-muted", style: {}, label: "Pendiente" }
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Greeting */}
      <div className="bg-white dark:bg-card rounded-lg shadow-md p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{todayStr}</p>
            <h2 className="text-2xl font-extrabold text-foreground text-balance">Buen día, {displayName}.</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tienes{" "}
              <span className="font-semibold" style={{ color: "var(--neon-green)" }}>
                {appointments.length} citas
              </span>{" "}
              programadas para hoy.
            </p>
          </div>
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--neon-green-bg)" }}
          >
            <Stethoscope size={28} style={{ color: "var(--neon-green)" }} />
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pacientes de hoy", value: String(appointments.length), icon: <User size={14} /> },
          { label: "En progreso", value: String(activeCount), icon: <Clock size={14} /> },
          { label: "Completadas", value: String(appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length), icon: <FileText size={14} /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando agenda...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-8 justify-center text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button onClick={loadAppointments} className="text-sm font-semibold underline ml-2">Reintentar</button>
        </div>
      )}

      {/* Appointment Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={`bg-white dark:bg-card rounded-lg shadow-md p-5 border flex flex-col gap-3 transition-all ${
                  isActive ? "border-[var(--neon-green)] shadow-sm" : "border-border"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{apt.patient?.identification ?? ""}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${badge.cls}`}
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
                        className="flex-1 py-2.5 rounded-md text-xs font-semibold border-2 transition-all hover:bg-muted"
                        style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)" }}
                      >
                        Abrir expediente
                      </button>
                      <button
                        onClick={() => handleEndConsultation(apt)}
                        disabled={isMutating}
                        className="flex-1 py-2.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {isMutating && <Loader2 size={12} className="animate-spin" />}
                        Finalizar consulta
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartConsultation(apt)}
                      disabled={isMutating || apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CANCELLED}
                      className="w-full py-2.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
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
