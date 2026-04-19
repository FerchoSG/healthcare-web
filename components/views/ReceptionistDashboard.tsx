"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, CalendarPlus, Clock, CheckCircle, DollarSign, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { AppointmentStatus, type Appointment } from "@/types/api"
import { fetchAppointments, updateAppointmentStatus } from "@/services/appointments.service"
import { useToast } from "@/hooks/use-toast"

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDateLabel(dateStr: string) {
  const today = toLocalDateStr(new Date())
  if (dateStr === today) return "Today"
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_CONSULTATION,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
]

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: "Pending",
  [AppointmentStatus.CONFIRMED]: "Confirmed",
  [AppointmentStatus.WAITING]: "Waiting",
  [AppointmentStatus.IN_CONSULTATION]: "In Consultation",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
}

const statusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: "text-muted-foreground bg-muted",
  [AppointmentStatus.CONFIRMED]: "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
  [AppointmentStatus.WAITING]: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
  [AppointmentStatus.IN_CONSULTATION]: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  [AppointmentStatus.COMPLETED]: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  [AppointmentStatus.CANCELLED]: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300",
}

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
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
}

interface ReceptionistDashboardProps {
  onNewAppointment: () => void
  onWalkIn: () => void
  onOpenEMR: (patientId: string) => void
}

export function ReceptionistDashboard({ onNewAppointment, onWalkIn, onOpenEMR }: ReceptionistDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAppointments(selectedDate, selectedDate)
      setAppointments(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { load() }, [load])

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00")
    d.setDate(d.getDate() + days)
    setSelectedDate(toLocalDateStr(d))
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    const prev = appointments
    // Optimistic update
    setAppointments((a) => a.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)))
    setMutatingId(id)
    try {
      const updated = await updateAppointmentStatus(id, newStatus)
      setAppointments((a) => a.map((apt) => (apt.id === id ? updated : apt)))
    } catch (err: unknown) {
      // Rollback on error
      setAppointments(prev)
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setMutatingId(null)
    }
  }

  const pending = appointments.filter((a) => a.status !== AppointmentStatus.COMPLETED && a.status !== AppointmentStatus.CANCELLED)
  const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED)

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Top strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Waiting</p>
            <p className="text-xl font-extrabold text-foreground">
              {appointments.filter((a) => a.status === AppointmentStatus.WAITING).length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--neon-green-bg)" }}>
            <CheckCircle size={16} style={{ color: "var(--neon-green)" }} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Completed</p>
            <p className="text-xl font-extrabold text-foreground">{completed.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <DollarSign size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Pending Checkout</p>
            <p className="text-xl font-extrabold text-foreground">{completed.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Today's Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-lg shadow-md p-5 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {formatDateLabel(selectedDate)}&apos;s Queue
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftDate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1.5 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={() => shiftDate(1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-all"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-all"
              >
                Today
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading appointments…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 py-8 justify-center text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
              <button onClick={load} className="text-sm font-semibold underline ml-2">Retry</button>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No appointments for {formatDateLabel(selectedDate).toLowerCase()}</p>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {appointments.map((apt) => {
                const name = `${apt.patient.first_name} ${apt.patient.last_name}`
                const initials = getInitials(apt.patient.first_name, apt.patient.last_name)
                const color = getAvatarColor(name)
                const isMutating = mutatingId === apt.id

                return (
                  <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 cursor-pointer hover:opacity-80 transition-all"
                      style={{ backgroundColor: color }}
                      onClick={() => onOpenEMR(apt.patient_id)}
                      title="Open medical record"
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(apt.start_time)} — {apt.reason ?? apt.service?.name ?? "Appointment"}
                      </p>
                    </div>
                    <div className="relative">
                      {isMutating && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 size={14} className="animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                        disabled={isMutating}
                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-md border-0 outline-none cursor-pointer focus:ring-2 focus:ring-ring/40 transition-all ${isMutating ? "opacity-30" : ""} ${statusColors[apt.status] || "text-muted-foreground bg-muted"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: Actions + Pending Checkouts */}
        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-card rounded-lg shadow-md p-5 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={onNewAppointment}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
              >
                <CalendarPlus size={16} />
                New Appointment
              </button>
              <button
                onClick={onWalkIn}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
              >
                <UserPlus size={16} />
                Walk-in Patient
              </button>
            </div>
          </div>

          {/* Pending Checkouts */}
          <div className="bg-white dark:bg-card rounded-lg shadow-md p-5 border border-border flex-1">
            <h3 className="text-sm font-bold text-foreground mb-3">Pending Checkouts</h3>
            {completed.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No pending checkouts</p>
            ) : (
              <div className="flex flex-col gap-2">
                {completed.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{apt.reason ?? apt.service?.name ?? "Appointment"}</p>
                    </div>
                    <button className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-foreground text-background hover:opacity-80 transition-all">
                      Checkout
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
