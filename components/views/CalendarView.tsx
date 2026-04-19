"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  fetchTimeBlocks,
  updateAppointmentStatus,
  deleteAppointment,
  createTimeBlock,
  deleteTimeBlock,
} from "@/services/appointments.service"
import type { Appointment, TimeBlock } from "@/types/api"
import { AppointmentStatus } from "@/types/api"
import { CalendarCell } from "@/components/calendar/CalendarCell"

// ─── Constants ────────────────────────────────────────────────────────────────

const CLINIC_TZ = "America/Costa_Rica"
const BUSINESS_START = 8
const BUSINESS_END = 17
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
  const now = new Date()
  const dow = now.getDay()
  const daysToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function toDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA")
}

function toClinicLocal(isoString: string): { dateKey: string; timeKey: string } {
  const d = new Date(isoString)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0"
  const year = get("year")
  const month = get("month")
  const day = get("day")
  const h = parseInt(get("hour")) % 24
  const m = parseInt(get("minute"))
  const slotMin = m < 15 ? 0 : m < 45 ? 30 : 0
  const slotHr = m >= 45 ? (h === 23 ? 0 : h + 1) : h
  return {
    dateKey: `${year}-${month}-${day}`,
    timeKey: `${String(slotHr).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`,
  }
}

// Costa Rica = UTC-6, no DST
function crLocalToUtcMs(dateKey: string, timeKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number)
  const [hour, minute] = timeKey.split(":").map(Number)
  return Date.UTC(year, month - 1, day, hour + 6, minute, 0)
}

function slotOverlapsBlock(dateKey: string, timeKey: string, block: TimeBlock): boolean {
  const slotStart = crLocalToUtcMs(dateKey, timeKey)
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

  // ── Week dates ─────────────────────────────────────────────────────────────

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const weekEnd = useMemo(() => weekDays[5], [weekDays])

  const weekLabel = useMemo(() => {
    const s = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const e = weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${s} – ${e}`
  }, [weekStart, weekEnd])

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    const start = toDateKey(weekStart)
    const end = toDateKey(weekEnd)
    setLoading(true)
    Promise.all([fetchAppointments(start, end), fetchTimeBlocks(start, end)])
      .then(([apts, blocks]) => {
        setAppointments(apts)
        setTimeBlocks(blocks)
      })
      .catch(() => {
        // Silently degrade when the user is not yet authenticated
      })
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  // ── Cell lookup maps ───────────────────────────────────────────────────────

  const aptByCell = useMemo(() => {
    const map = new Map<string, Appointment>()
    for (const apt of appointments) {
      if (apt.status === AppointmentStatus.CANCELLED) continue
      const { dateKey, timeKey } = toClinicLocal(apt.start_time)
      const key = `${dateKey}|${timeKey}`
      if (!map.has(key)) map.set(key, apt)
    }
    return map
  }, [appointments])

  const blockByCell = useMemo(() => {
    const map = new Map<string, TimeBlock>()
    for (const block of timeBlocks) {
      const { dateKey } = toClinicLocal(block.start_time)
      for (const timeKey of TIME_SLOTS) {
        const key = `${dateKey}|${timeKey}`
        if (!map.has(key) && slotOverlapsBlock(dateKey, timeKey, block)) {
          map.set(key, block)
        }
      }
    }
    return map
  }, [timeBlocks])

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
    setBlockDoctorId("")
    setBlockReason("")
    setBlockDialogOpen(true)
  }, [pendingSlot])

  const handleCreateBlock = useCallback(async () => {
    if (!pendingSlot || !blockDoctorId.trim()) return
    setSaving(true)
    try {
      const startMs = crLocalToUtcMs(pendingSlot.date, pendingSlot.time)
      const endMs = startMs + 30 * 60 * 1000
      const block = await createTimeBlock({
        doctor_id: blockDoctorId.trim(),
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(endMs).toISOString(),
        reason: blockReason.trim() || undefined,
      })
      setTimeBlocks((prev) => [...prev, block])
      setBlockDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }, [pendingSlot, blockDoctorId, blockReason])

  const handleDeleteBlock = useCallback(async (block: TimeBlock) => {
    if (!confirm(`Remove block "${block.reason ?? "Blocked"}"?`)) return
    setSaving(true)
    try {
      await deleteTimeBlock(block.id)
      setTimeBlocks((prev) => prev.filter((b) => b.id !== block.id))
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
    } finally {
      setSaving(false)
    }
  }, [selectedAppointment])

  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    if (!confirm("Permanently delete this appointment?")) return
    setSaving(true)
    try {
      await deleteAppointment(selectedAppointment.id)
      setAppointments((prev) => prev.filter((a) => a.id !== selectedAppointment.id))
      setEditDialogOpen(false)
      setSelectedAppointment(null)
    } finally {
      setSaving(false)
    }
  }, [selectedAppointment])

  const todayKey = toDateKey(new Date())

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">

      {/* ── Main calendar card ───────────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg shadow-md border border-border flex flex-col overflow-hidden"
        style={{ minHeight: "560px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-foreground">Weekly Calendar</h3>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-md hidden sm:inline">
              {weekLabel}
            </span>
            {loading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">Loading…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Mobile: agenda list ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2 p-4 lg:hidden flex-1 overflow-y-auto">
          {weekDays.map((dayDate, dayIdx) => {
            const dateKey = toDateKey(dayDate)
            const dayApts = appointments.filter(
              (a) =>
                a.status !== AppointmentStatus.CANCELLED &&
                toClinicLocal(a.start_time).dateKey === dateKey,
            )
            const isToday = dateKey === todayKey
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span
                    className={`text-xs font-bold w-7 h-7 rounded-md flex items-center justify-center ${
                      isToday ? "text-white" : "text-foreground bg-muted"
                    }`}
                    style={isToday ? { backgroundColor: "var(--neon-green)" } : {}}
                  >
                    {dayDate.getDate()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {DAY_LABELS[dayIdx]}
                  </span>
                </div>
                {dayApts.length > 0 ? (
                  dayApts.map((apt) => {
                    const { timeKey } = toClinicLocal(apt.start_time)
                    return (
                      <button
                        key={apt.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border mb-1.5 text-left hover:bg-muted/60 transition-all"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {apt.patient.first_name} {apt.patient.last_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {timeKey} — {apt.reason ?? apt.service?.name ?? ""}
                          </p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <button
                    onClick={() => handleCellClick(dateKey, "09:00")}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-muted-foreground hover:bg-muted/40 transition-all mb-1.5"
                  >
                    + Add appointment
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
            style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}
          >
            <div className="py-3" />
            {weekDays.map((dayDate, i) => {
              const dateKey = toDateKey(dayDate)
              const isToday = dateKey === todayKey
              return (
                <div key={dateKey} className="py-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-md flex items-center justify-center mx-auto ${
                      isToday ? "text-white" : "text-foreground"
                    }`}
                    style={isToday ? { backgroundColor: "var(--neon-green)" } : {}}
                  >
                    {dayDate.getDate()}
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
                  style={{ gridTemplateColumns: "56px repeat(6, 1fr)", minHeight: "48px" }}
                >
                  <div className="px-2 pt-1 shrink-0">
                    {!isHalfHour && (
                      <span className="text-[10px] text-muted-foreground leading-none">
                        {timeKey}
                      </span>
                    )}
                  </div>
                  {weekDays.map((dayDate) => {
                    const dateKey = toDateKey(dayDate)
                    const cellKey = `${dateKey}|${timeKey}`
                    return (
                      <CalendarCell
                        key={cellKey}
                        date={dateKey}
                        time={timeKey}
                        appointment={aptByCell.get(cellKey)}
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
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-4">Upcoming Appointments</h3>
        {appointments.filter((a) => a.status !== AppointmentStatus.CANCELLED).length === 0 ? (
          <p className="text-xs text-muted-foreground">No appointments this week.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appointments
              .filter((a) => a.status !== AppointmentStatus.CANCELLED)
              .slice(0, 8)
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
                      <p className="text-[10px] text-muted-foreground">
                        {timeKey} — {apt.reason ?? apt.service?.name ?? ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {apt.doctor.first_name} {apt.doctor.last_name.charAt(0)}.
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
            <DialogTitle className="text-sm font-bold">
              {pendingSlot?.date} · {pendingSlot?.time}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose an action for this time slot.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 flex flex-col gap-3">
            <button
              onClick={handleSlotNewAppointment}
              className="w-full px-4 py-3 rounded-md bg-foreground text-background text-sm font-semibold text-left hover:opacity-90 transition-all shadow-sm"
            >
              📅 New Appointment
            </button>
            <button
              onClick={handleSlotBlockTime}
              className="w-full px-4 py-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm font-semibold text-left hover:bg-red-100 transition-all"
            >
              🚫 Block This Time Slot
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Block time form */}
      <Dialog open={blockDialogOpen} onOpenChange={(o) => !o && setBlockDialogOpen(false)}>
        <DialogContent className="rounded-lg w-[95vw] max-w-sm p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-sm font-bold">Block Time Slot</DialogTitle>
            <DialogDescription className="sr-only">
              Block a doctor&apos;s availability for a 30-minute slot.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Blocking <strong>{pendingSlot?.date}</strong> at{" "}
              <strong>{pendingSlot?.time}</strong> (30 min)
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Doctor ID</label>
              <input
                type="text"
                placeholder="Paste doctor UUID…"
                value={blockDoctorId}
                onChange={(e) => setBlockDoctorId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch break, Personal leave…"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border flex gap-2">
            <button
              onClick={() => setBlockDialogOpen(false)}
              className="flex-1 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBlock}
              disabled={saving || !blockDoctorId.trim()}
              className="flex-1 px-4 py-2 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? "Saving…" : "Block Slot"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Appointment detail / actions */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => !o && setEditDialogOpen(false)}>
        <DialogContent className="rounded-lg w-[95vw] max-w-sm p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-sm font-bold">Appointment Details</DialogTitle>
            <DialogDescription className="sr-only">
              View and manage this appointment.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <>
              <div className="px-6 py-5 flex flex-col gap-3">
                <InfoRow label="Patient">
                  {selectedAppointment.patient.first_name}{" "}
                  {selectedAppointment.patient.last_name}
                </InfoRow>
                <InfoRow label="Doctor">
                  {selectedAppointment.doctor.first_name}{" "}
                  {selectedAppointment.doctor.last_name}
                </InfoRow>
                <InfoRow label="Time">
                  {toClinicLocal(selectedAppointment.start_time).dateKey}{" "}
                  {toClinicLocal(selectedAppointment.start_time).timeKey}
                </InfoRow>
                {selectedAppointment.reason && (
                  <InfoRow label="Reason">{selectedAppointment.reason}</InfoRow>
                )}
                {selectedAppointment.service && (
                  <InfoRow label="Service">{selectedAppointment.service.name}</InfoRow>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </span>
                  <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-md">
                    {selectedAppointment.status}
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
                  className="w-full px-4 py-2.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold hover:bg-amber-100 transition-all disabled:opacity-50"
                >
                  Mark as Cancelled
                </button>
                <button
                  onClick={handleDeleteAppointment}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
                >
                  {saving ? "Deleting…" : "Delete Appointment"}
                </button>
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="w-full px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  Close
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
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  )
}
