"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CITABOX_DATA_CHANGED_EVENT } from "@/lib/data-events"
import {
  clinicLocalDateTimeToMs,
  formatClinicDateFromKey,
  formatClinicDateKey,
  getClinicTodayKey,
  getClinicLocalParts,
  parseClinicDateKey,
} from "@/lib/clinic-time"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  fetchAppointments,
  fetchAppointmentByReference,
  fetchTimeBlocks,
  updateAppointmentStatus,
  deleteAppointment,
  createTimeBlock,
  deleteTimeBlock,
} from "@/services/appointments.service"
import type { Appointment, TimeBlock } from "@/types/api"
import { AppointmentStatus } from "@/types/api"
import { CalendarCell } from "@/components/calendar/CalendarCell"
import { appointmentStatusClass, appointmentStatusLabel } from "@/lib/design"
import { fetchDoctors } from "@/services/clinic-services.service"
import type { DoctorSummary } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HttpError } from "@/lib/api-client"

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_START = 8
const BUSINESS_END = 17
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const TIME_SLOTS: string[] = (() => {
  const s: string[] = []
  for (let h = BUSINESS_START; h < BUSINESS_END; h++) {
    s.push(`${String(h).padStart(2, "0")}:00`)
    s.push(`${String(h).padStart(2, "0")}:30`)
  }
  return s
})()

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekStart(offset: number): Date {
  const now = parseClinicDateKey(getClinicTodayKey())
  const dow = now.getUTCDay()
  const daysToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + daysToMonday + offset * 7)
  return monday
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setUTCDate(weekStart.getUTCDate() + i)
    return d
  })
}

function toDateKey(d: Date): string {
  return formatClinicDateKey(d)
}

function toClinicLocal(isoString: string): { dateKey: string; timeKey: string } {
  return getClinicLocalParts(isoString)
}

function slotOverlapsBlock(dateKey: string, timeKey: string, block: TimeBlock): boolean {
  const slotStart = clinicLocalDateTimeToMs(dateKey, timeKey)
  const slotEnd = slotStart + 30 * 60 * 1000
  const blockStart = new Date(block.start_time).getTime()
  const blockEnd = new Date(block.end_time).getTime()
  return slotStart < blockEnd && slotEnd > blockStart
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarViewProps {
  onNewAppointment: (slot: { date?: string; time?: string }) => void
}

export function CalendarView({ onNewAppointment }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<DoctorSummary[]>([])
  const [doctorFilter, setDoctorFilter] = useState("")
  const [mode, setMode] = useState<"week" | "day">("week")
  const [dayIndex, setDayIndex] = useState(() => Math.min(5, (parseClinicDateKey(getClinicTodayKey()).getUTCDay() + 6) % 7))

  // Slot-action dialog: choose between New Appointment or Block Time
  const [slotActionOpen, setSlotActionOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState<{ date: string; time: string } | null>(null)

  // Block-time dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockDoctorId, setBlockDoctorId] = useState("")
  const [blockReason, setBlockReason] = useState("")

  // Edit-appointment dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const [saving, setSaving] = useState(false)
  const [referenceSearch, setReferenceSearch] = useState("")
  const [findingReference, setFindingReference] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)

  const findReference = async (event: React.FormEvent) => {
    event.preventDefault()
    if (findingReference) return
    const code = referenceSearch.toUpperCase().replace(/[\s-]/g, "")
    if (!/^CB[A-Z2-9]{8}$/.test(code)) {
      setReferenceError("Ingresa una referencia con el formato CB-XXXX-XXXX.")
      return
    }
    setFindingReference(true)
    setReferenceError(null)
    try {
      const appointment = await fetchAppointmentByReference(referenceSearch)
      setSelectedAppointment(appointment)
      setEditDialogOpen(true)
    } catch (error) {
      setReferenceError(error instanceof HttpError && error.status === 404
        ? "No se encontró una cita con esa referencia en esta clínica."
        : "No se pudo buscar la cita. Revisa tu conexión e intenta de nuevo.")
    } finally { setFindingReference(false) }
  }

  // ── Week dates ─────────────────────────────────────────────────────────────

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const weekEnd = useMemo(() => weekDays[5], [weekDays])
  const visibleDays = mode === "day" ? [weekDays[dayIndex]] : weekDays
  const visibleAppointments = useMemo(() => appointments.filter(a => !doctorFilter || a.doctor.id === doctorFilter), [appointments, doctorFilter])
  const columns = `56px repeat(${visibleDays.length}, minmax(0, 1fr))`
  const listAppointments = visibleAppointments.filter(a => a.status !== AppointmentStatus.CANCELLED && (mode === "week" || toClinicLocal(a.start_time).dateKey === toDateKey(weekDays[dayIndex])))

  useEffect(() => { fetchDoctors().then(setDoctors).catch(() => setError("No se pudieron cargar los profesionales.")) }, [])

  const weekLabel = useMemo(() => {
    const s = formatClinicDateFromKey(toDateKey(weekStart), { month: "short", day: "numeric" })
    const e = formatClinicDateFromKey(toDateKey(weekEnd), {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${s} – ${e}`
  }, [weekStart, weekEnd])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadWeekData = useCallback(() => {
    const start = toDateKey(weekStart)
    const end = toDateKey(weekEnd)
    setLoading(true)
    setError(null)
    return Promise.all([fetchAppointments(start, end), fetchTimeBlocks(start, end)])
      .then(([apts, blocks]) => {
        setAppointments(apts)
        setTimeBlocks(blocks)
      })
      .catch(() => {
        setError("No se pudo cargar la agenda. Intenta de nuevo.")
      })
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  useEffect(() => {
    void loadWeekData()
  }, [loadWeekData])

  useEffect(() => {
    const handler = () => {
      void loadWeekData()
    }
    window.addEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
  }, [loadWeekData])

  // ── Cell lookup maps ───────────────────────────────────────────────────────

  const aptByCell = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const apt of visibleAppointments) {
      if (apt.status === AppointmentStatus.CANCELLED) continue
      const { dateKey, timeKey } = toClinicLocal(apt.start_time)
      const roundedTime = `${timeKey.slice(0, 2)}:${Number(timeKey.slice(3)) < 30 ? "00" : "30"}`
      const key = `${dateKey}|${roundedTime}`
      map.set(key, [...(map.get(key) ?? []), apt])
    }
    return map
  }, [visibleAppointments])

  const blockByCell = useMemo(() => {
    const map = new Map<string, TimeBlock>()
    for (const block of timeBlocks) {
      if (doctorFilter && block.doctor_id !== doctorFilter) continue
      const { dateKey } = toClinicLocal(block.start_time)
      for (const timeKey of TIME_SLOTS) {
        const key = `${dateKey}|${timeKey}`
        if (!map.has(key) && slotOverlapsBlock(dateKey, timeKey, block)) {
          map.set(key, block)
        }
      }
    }
    return map
  }, [timeBlocks, doctorFilter])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCellClick = useCallback((date: string, time: string) => {
    setPendingSlot({ date, time })
    setSlotActionOpen(true)
  }, [])

  const handleSlotNewAppointment = useCallback(() => {
    if (!pendingSlot) return
    setSlotActionOpen(false)
    onNewAppointment(pendingSlot)
  }, [pendingSlot, onNewAppointment])

  const handleSlotBlockTime = useCallback(() => {
    if (!pendingSlot) return
    setSlotActionOpen(false)
    setBlockDoctorId(doctorFilter || doctors[0]?.id || "")
    setBlockReason("")
    setBlockDialogOpen(true)
  }, [pendingSlot, doctorFilter, doctors])

  const handleCreateBlock = useCallback(async () => {
    if (!pendingSlot || !blockDoctorId.trim()) return
    setSaving(true)
    try {
      const startMs = clinicLocalDateTimeToMs(pendingSlot.date, pendingSlot.time)
      const endMs = startMs + 30 * 60 * 1000
      const block = await createTimeBlock({
        doctor_id: blockDoctorId.trim(),
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(endMs).toISOString(),
        reason: blockReason.trim() || undefined,
      })
      setTimeBlocks((prev) => [...prev, block])
      setBlockDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo bloquear el horario.")
    } finally {
      setSaving(false)
    }
  }, [pendingSlot, blockDoctorId, blockReason])

  const handleDeleteBlock = useCallback(async (block: TimeBlock) => {
    if (!confirm(`¿Eliminar el bloqueo "${block.reason ?? "Bloqueado"}"?`)) return
    setSaving(true)
    try {
      await deleteTimeBlock(block.id)
      setTimeBlocks((prev) => prev.filter((b) => b.id !== block.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el bloqueo.")
    } finally {
      setSaving(false)
    }
  }, [])

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditDialogOpen(true)
  }, [])

  const handleCancelAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    setSaving(true)
    try {
      await updateAppointmentStatus(selectedAppointment.id, AppointmentStatus.CANCELLED)
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedAppointment.id
            ? { ...a, status: AppointmentStatus.CANCELLED }
            : a,
        ),
      )
      setEditDialogOpen(false)
      setSelectedAppointment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la cita.")
    } finally {
      setSaving(false)
    }
  }, [selectedAppointment])

  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    if (!confirm("¿Eliminar esta cita de forma permanente?")) return
    setSaving(true)
    try {
      await deleteAppointment(selectedAppointment.id)
      setAppointments((prev) => prev.filter((a) => a.id !== selectedAppointment.id))
      setEditDialogOpen(false)
      setSelectedAppointment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la cita.")
    } finally {
      setSaving(false)
    }
  }, [selectedAppointment])

  const todayKey = getClinicTodayKey()

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-md bg-transparent">

      <form onSubmit={findReference} className="citabox-panel p-4">
        <label htmlFor="appointment-reference-search" className="mb-2 block text-sm font-medium">Buscar cita por referencia</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="appointment-reference-search" className="h-11 shadow-none sm:max-w-xs" placeholder="CB-7K9P-3M8H" autoComplete="off" maxLength={32} value={referenceSearch} onChange={event => { setReferenceSearch(event.target.value); setReferenceError(null) }} aria-describedby="appointment-reference-help" aria-invalid={!!referenceError} />
          <Button className="h-11" type="submit" disabled={findingReference || !referenceSearch.trim()}>{findingReference ? "Buscando…" : "Buscar cita"}</Button>
        </div>
        <p id="appointment-reference-help" className="mt-2 text-xs text-muted-foreground">Busca en todas las fechas de la clínica activa usando el código del comprobante.</p>
        {referenceError && <p role="alert" className="mt-2 text-sm text-danger">{referenceError}</p>}
      </form>

      {/* ── Main calendar card ───────────────────────────────────────────── */}
      <div
        className="citabox-panel flex flex-col overflow-hidden"
        style={{ minHeight: "560px" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Agenda</h2>
            <span className="hidden rounded-md bg-[var(--ds-action-soft)] px-3 py-1 text-xs font-semibold text-[var(--ds-action)] sm:inline">
              {weekLabel}
            </span>
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">Cargando...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label="Semana anterior"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ds-surface-alt)] text-muted-foreground transition-all hover:text-foreground"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="citabox-action rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Semana siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ds-surface-alt)] text-muted-foreground transition-all hover:text-foreground"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <label className="flex items-center gap-2 text-sm">Profesional<select aria-label="Filtrar por profesional" className="max-w-56 rounded-md border border-input bg-card p-2" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}><option value="">Todos</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.first_name} {doctor.last_name}</option>)}</select></label>
          <div className="flex gap-1"><Button variant={mode === "week" ? "default" : "outline"} aria-pressed={mode === "week"} onClick={() => setMode("week")}>Semana</Button><Button variant={mode === "day" ? "default" : "outline"} aria-pressed={mode === "day"} onClick={() => setMode("day")}>Día</Button></div>
          {mode === "day" && <select aria-label="Día de la agenda" className="rounded-md border border-input bg-card p-2 text-sm" value={dayIndex} onChange={e => setDayIndex(Number(e.target.value))}>{weekDays.map((day, index) => <option key={index} value={index}>{formatClinicDateFromKey(toDateKey(day), { weekday: "long", day: "numeric", month: "short" })}</option>)}</select>}
          {error && <p role="alert" className="flex items-center gap-2 text-sm text-danger">{error}<Button variant="outline" onClick={() => void loadWeekData()}>Reintentar</Button></p>}
        </div>

        {/* ── Mobile: agenda list ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2 p-4 lg:hidden flex-1 overflow-y-auto">
          {visibleDays.map((dayDate) => {
            const dateKey = toDateKey(dayDate)
            const dayApts = visibleAppointments.filter(
              (a) =>
                a.status !== AppointmentStatus.CANCELLED &&
                toClinicLocal(a.start_time).dateKey === dateKey,
            )
            const isToday = dateKey === todayKey
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span
                    className={`text-xs font-semibold w-7 h-7 rounded-md flex items-center justify-center ${
                      isToday ? "text-primary-foreground" : "text-foreground bg-muted"
                    }`}
                    style={isToday ? { backgroundColor: "var(--ds-action)" } : {}}
                  >
                    {dayDate.getUTCDate()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {DAY_LABELS[(dayDate.getUTCDay() + 6) % 7]}
                  </span>
                </div>
                {dayApts.length > 0 ? (
                  dayApts.map((apt) => {
                    const { timeKey } = toClinicLocal(apt.start_time)
                    return (
                      <button
                        key={apt.id}
                         className="mb-1.5 flex w-full items-center gap-3 rounded-md border border-border bg-[var(--ds-surface-alt)] p-3 text-left transition-all hover:bg-[var(--ds-action-soft)]"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {apt.patient.first_name} {apt.patient.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeKey} — {apt.reason ?? apt.service?.name ?? ""}
                          </p>
                          <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${appointmentStatusClass(apt.status)}`}>{appointmentStatusLabel(apt.status)}</span>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <button
                    onClick={() => handleCellClick(dateKey, "09:00")}
                     className="mb-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:border-[var(--ds-action)] hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]"
                  >
                    + Agregar cita
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Desktop: time-grid ──────────────────────────────────────── */}
        <div className="hidden lg:flex lg:flex-col flex-1 overflow-hidden">
          {/* Day-of-week headers */}
          <div
            className="grid border-b border-border shrink-0"
            style={{ gridTemplateColumns: columns }}
          >
            <div className="py-3" />
            {visibleDays.map((dayDate) => {
              const dateKey = toDateKey(dayDate)
              const isToday = dateKey === todayKey
              return (
                <div key={dateKey} className="py-3 text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {DAY_LABELS[(dayDate.getUTCDay() + 6) % 7]}
                  </p>
                  <p
                    className={`text-sm font-semibold mt-0.5 w-7 h-7 rounded-md flex items-center justify-center mx-auto ${
                      isToday ? "text-primary-foreground" : "text-foreground"
                    }`}
                    style={isToday ? { backgroundColor: "var(--ds-action)" } : {}}
                  >
                    {dayDate.getUTCDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Half-hourly rows */}
          <div className="flex-1 overflow-y-auto">
            {TIME_SLOTS.map((timeKey) => {
              const isHalfHour = timeKey.endsWith(":30")
              return (
                <div
                  key={timeKey}
                  className={`grid ${
                    isHalfHour
                      ? "border-b border-dashed border-border/50"
                      : "border-b border-border"
                  }`}
                  style={{ gridTemplateColumns: columns, minHeight: "56px" }}
                >
                  <div className="px-2 pt-1 shrink-0">
                    {!isHalfHour && (
                      <span className="text-xs text-muted-foreground leading-none">
                        {timeKey}
                      </span>
                    )}
                  </div>
                  {visibleDays.map((dayDate) => {
                    const dateKey = toDateKey(dayDate)
                    const cellKey = `${dateKey}|${timeKey}`
                    return (
                      <CalendarCell
                        key={cellKey}
                        date={dateKey}
                        time={timeKey}
                        appointments={aptByCell.get(cellKey)}
                        timeBlock={blockByCell.get(cellKey)}
                        onClickEmpty={handleCellClick}
                        onClickAppointment={handleAppointmentClick}
                        onClickTimeBlock={handleDeleteBlock}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Upcoming appointments list ──────────────────────────────────── */}
      <div className="bg-card rounded-lg  p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">{mode === "day" ? "Citas del día" : "Citas de la semana"}</h3>
        {listAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay citas para esta selección.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listAppointments
              .map((apt) => {
                const { timeKey } = toClinicLocal(apt.start_time)
                return (
                  <button
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border text-left hover:bg-muted/60 transition-all"
                    onClick={() => handleAppointmentClick(apt)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      {apt.reference && <p className="mt-1 font-mono text-xs text-muted-foreground">{apt.reference}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatClinicDateFromKey(toClinicLocal(apt.start_time).dateKey, { day: "numeric", month: "short" })} · {timeKey} — {apt.service?.name ?? apt.reason ?? ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium shrink-0">
                      {apt.doctor.first_name} {apt.doctor.last_name.charAt(0)}.
                      <span className={`mt-1 block rounded-md px-2 py-1 ${appointmentStatusClass(apt.status)}`}>{appointmentStatusLabel(apt.status)}</span>
                    </span>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* ════════════════════════ Dialogs ════════════════════════ */}

      {/* 1. Slot action: New Appointment or Block Time */}
      <Dialog open={slotActionOpen} onOpenChange={(o) => !o && setSlotActionOpen(false)}>
        <DialogContent className="rounded-lg w-[95vw] max-w-xs p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-sm font-semibold">
              {pendingSlot?.date} · {pendingSlot?.time}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Elige una acción para este espacio.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 flex flex-col gap-3">
            <button
              onClick={handleSlotNewAppointment}
              className="w-full px-4 py-3 rounded-md bg-primary text-primary-foreground text-sm font-semibold text-left hover:opacity-90 transition-all "
            >
              Nueva cita
            </button>
            <button
              onClick={handleSlotBlockTime}
              className="w-full px-4 py-3 rounded-md bg-neutral-bg text-neutral border border-input text-sm font-semibold text-left hover:bg-danger-bg transition-all"
            >
              Bloquear este espacio
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Block time form */}
      <Dialog open={blockDialogOpen} onOpenChange={(o) => !o && setBlockDialogOpen(false)}>
        <DialogContent className="rounded-lg w-[95vw] max-w-sm p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-sm font-semibold">Bloquear espacio</DialogTitle>
            <DialogDescription className="sr-only">
              Bloquea la disponibilidad de un doctor por 30 minutos.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 flex flex-col gap-4">
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Bloqueando <strong>{pendingSlot?.date}</strong> a las{" "}
              <strong>{pendingSlot?.time}</strong> (30 min)
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="block-doctor" className="text-xs font-semibold text-foreground">Profesional</label>
              <select
                id="block-doctor"
                value={blockDoctorId}
                onChange={(e) => setBlockDoctorId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              ><option value="">Seleccionar profesional</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.first_name} {doctor.last_name}</option>)}</select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="block-reason" placeholder="Ej. almuerzo, permiso personal..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border flex gap-2">
            <button
              onClick={() => setBlockDialogOpen(false)}
              className="flex-1 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateBlock}
              disabled={saving || !blockDoctorId.trim()}
              className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Bloquear"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Appointment detail / actions */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => !o && setEditDialogOpen(false)}>
        <DialogContent className="rounded-lg w-[95vw] max-w-sm p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-sm font-semibold">Detalle de la cita</DialogTitle>
            <DialogDescription className="sr-only">
              Consulta y administra esta cita.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <>
              <div className="px-6 py-5 flex flex-col gap-3">
                {selectedAppointment.reference && <InfoRow label="Referencia"><span className="font-mono">{selectedAppointment.reference}</span></InfoRow>}
                <InfoRow label="Paciente">
                  {selectedAppointment.patient.first_name}{" "}
                  {selectedAppointment.patient.last_name}
                </InfoRow>
                <InfoRow label="Doctor">
                  {selectedAppointment.doctor.first_name}{" "}
                  {selectedAppointment.doctor.last_name}
                </InfoRow>
                <InfoRow label="Hora">
                  {toClinicLocal(selectedAppointment.start_time).dateKey}{" "}
                  {toClinicLocal(selectedAppointment.start_time).timeKey}
                </InfoRow>
                {selectedAppointment.reason && (
                  <InfoRow label="Motivo">{selectedAppointment.reason}</InfoRow>
                )}
                {selectedAppointment.service && (
                  <InfoRow label="Servicio">{selectedAppointment.service.name}</InfoRow>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Estado
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${appointmentStatusClass(selectedAppointment.status)}`}>
                    {appointmentStatusLabel(selectedAppointment.status)}
                  </span>
                </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-border flex flex-col gap-2">
                <button
                  onClick={handleCancelAppointment}
                  disabled={
                    saving ||
                    selectedAppointment.status === AppointmentStatus.CANCELLED
                  }
                  className="w-full px-4 py-2.5 rounded-md bg-danger-bg text-danger border border-danger text-sm font-semibold hover:bg-danger-bg transition-all disabled:opacity-50"
                >
                  Marcar como cancelada
                </button>
                <button
                  onClick={handleDeleteAppointment}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-md bg-danger-bg text-danger border border-danger text-sm font-semibold hover:bg-danger-bg transition-all disabled:opacity-50"
                >
                  {saving ? "Eliminando..." : "Eliminar cita"}
                </button>
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="w-full px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  Cerrar
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tiny label+value row used inside the edit dialog ────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  )
}
