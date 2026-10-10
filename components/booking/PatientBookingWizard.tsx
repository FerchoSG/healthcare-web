"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  MessageCircle,
  CalendarPlus,
  Check,
  MapPin,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react"
import type {
  ServiceSummary,
  DoctorSummary,
  TimeSlot,
  BookingConfirmation,
  PublicClinic,
} from "@/types/api"
import {
  getServices,
  getDoctors,
  getAvailableSlots,
  createBooking,
} from "@/services/booking.service"
import { BRAND_NAME } from "@/lib/brand"
import { Input } from "@/components/ui/input"
import { appointmentEmailMessage, isValidOptionalEmail } from "@/lib/appointment-email"
import { formatClinicDateFromKey, getClinicTodayKey, parseClinicDateKey } from "@/lib/clinic-time"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingFormData {
  serviceId: string
  doctorId: string
  date: string
  time: string
  firstName: string
  lastName: string
  cedula: string
  whatsapp: string
  email: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Servicio","Fecha","Datos","Revisión"]
const TODAY_KEY = getClinicTodayKey()
const TODAY = parseClinicDateKey(TODAY_KEY)
const AVATAR_COLORS = ["var(--ds-action-soft)"]

const EMPTY_BOOKING: BookingFormData = {
  serviceId: "", doctorId: "any", date: "", time: "",
  firstName: "", lastName: "", cedula: "", whatsapp: "", email: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDoctorColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getDoctorInitials(doc: DoctorSummary): string {
  return `${doc.first_name?.[0] ?? ""}${doc.last_name?.[0] ?? ""}`.toUpperCase()
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 2 }).format(price / 100)
}

function formatDuration(minutes: number): string {
  return `${minutes} min`
}

function formatDateShort(iso: string): string | null {
  if (!iso) return null
  return formatClinicDateFromKey(iso, { weekday: "short", month: "short", day: "numeric" })
}

function formatDateLong(iso: string): string {
  if (!iso) return "—"
  return formatClinicDateFromKey(iso, { weekday: "long", month: "long", day: "numeric" })
}

function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`
}

function getDoctorDisplayName(doc: DoctorSummary): string {
  if (doc.id === "any") return "Cualquier disponible"
  return `Dr. ${doc.first_name} ${doc.last_name?.[0] ?? ""}.`
}

// ─── Sub-Components (defined OUTSIDE main component to prevent remount) ────────

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const [vm, setVm] = useState(TODAY.getUTCMonth())
  const viewDate = new Date(Date.UTC(TODAY.getUTCFullYear(), vm, 1, 12))
  const vy = viewDate.getUTCFullYear()
  const month = viewDate.getUTCMonth()

  const firstDay    = new Date(Date.UTC(vy, month, 1, 12)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(vy, month + 1, 0, 12)).getUTCDate()
  const label       = formatClinicDateFromKey(`${vy}-${String(month + 1).padStart(2,"0")}-01`, { month: "long", year: "numeric" })
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const iso  = (d: number) => `${vy}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
  const past = (d: number) => iso(d) < TODAY_KEY

  return (
    <div className="citabox-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setVm(m => Math.max(m - 1, TODAY.getUTCMonth()))}
          aria-label="Mes anterior"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
        ><ChevronLeft size={14} /></button>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <button
          onClick={() => setVm(m => m + 1)}
          aria-label="Mes siguiente"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
        ><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Do","Lu","Ma","Mi","Ju","Vi","Sá"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const key    = iso(day)
          const isPast = past(day)
          const isSel  = selected === key
          return (
            <button
              key={key}
              aria-label={`Seleccionar ${key}`}
              disabled={isPast}
              onClick={() => onSelect(key)}
              className={[
                "w-8 h-8 mx-auto rounded-md text-xs font-semibold flex items-center justify-center transition-all",
                isPast ? "text-muted-foreground cursor-not-allowed"
                : isSel ? "bg-[var(--ds-action)] text-primary-foreground "
                        : "text-foreground hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]",
              ].join(" ")}
            >{day}</button>
          )
        })}
      </div>
    </div>
  )
}

function DoctorGrid({ doctors, selected, onSelect, compact = false, loading = false }: {
  doctors: DoctorSummary[]
  selected: string
  onSelect: (id: string) => void
  compact?: boolean
  loading?: boolean
}) {
  const ANY_OPTION: DoctorSummary = { id: "any", first_name: "Cualquiera", last_name: "Disponible", specialty: "Te asignaremos uno" }
  const allDoctors = [ANY_OPTION, ...doctors]

  if (loading) {
    return (
      <div className={compact ? "grid grid-cols-4 gap-2" : "flex gap-3 overflow-x-auto pb-1"}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="w-14 h-2.5 bg-muted rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={compact ? "grid grid-cols-4 gap-2" : "flex gap-3 overflow-x-auto pb-1"}>
      {allDoctors.map((doc, idx) => {
        const color = doc.id === "any" ? "var(--ds-action-soft)" : getDoctorColor(idx - 1)
        const initials = doc.id === "any" ? "?" : getDoctorInitials(doc)
        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 transition-all active:scale-95"
          >
            <div
              className={[
                "w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold border-[3px] transition-all",
                selected === doc.id ? "border-[var(--ds-action)] scale-105 " : "border-transparent opacity-80 hover:opacity-100",
              ].join(" ")}
              style={{ backgroundColor: color, color: "var(--ds-text)" }}
            >{initials}</div>
            <div className="text-center w-16">
              <div className="text-xs font-semibold text-foreground truncate">
                {doc.id === "any" ? "Cualquiera" : doc.first_name}
              </div>
              <div className="text-xs text-muted-foreground leading-tight truncate">
                {doc.id === "any" ? "Disponible" : (doc.specialty?.split(" ")[0] ?? "")}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ServiceList({ services, selected, onSelect, loading = false }: { services: ServiceSummary[]; selected: string; onSelect: (id: string) => void; loading?: boolean }) {
  if (loading) return <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} />Cargando servicios…</p>
  if (!services.length) return <p className="py-8 text-sm text-muted-foreground">No hay servicios disponibles para esta selección.</p>
  return <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">{services.map(service => <button type="button" key={service.id} aria-pressed={selected === service.id} onClick={() => onSelect(service.id)} className={`flex w-full items-start justify-between gap-3 border-l-4 p-4 text-left hover:bg-muted ${selected === service.id ? "border-l-primary bg-accent" : "border-l-transparent bg-card"}`}><div className="min-w-0"><span className="block text-sm font-semibold">{service.name}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{service.description}</span></div><div className="shrink-0 text-right"><span className="block text-sm font-semibold tabular-nums">{formatPrice(service.price)}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDuration(service.duration_minutes)}</span>{selected === service.id && <Check size={16} className="ml-auto mt-2 text-primary" />}</div></button>)}</div>
}

function TimeSlotGrid({ slots, selected, onSelect, loading = false }: {
  slots: TimeSlot[]
  selected: string
  onSelect: (time: string, doctorId?: string | null) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No hay horarios disponibles para esta fecha.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(slot => {
        const isSel = selected === slot.time
        return (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => onSelect(slot.time, slot.doctor_id)}
            className={[
              "py-2.5 rounded-md text-xs font-semibold transition-all active:scale-95",
              !slot.available ? "bg-card text-muted-foreground cursor-not-allowed line-through"
              : isSel  ? "bg-[var(--ds-action)] text-primary-foreground "
                       : "bg-card border border-border text-foreground hover:border-[var(--ds-action)] hover:text-[var(--ds-action)]",
            ].join(" ")}
          >{formatSlotTime(slot.time)}</button>
        )
      })}
    </div>
  )
}

function StepPillBar({ step }: { step: number }) {
  return <nav aria-label="Progreso de la reserva" className="grid w-full grid-cols-4 gap-1">{STEP_LABELS.map((label, i) => <span key={label} aria-current={step === i + 1 ? "step" : undefined} className={`rounded-md px-1 py-2 text-center text-xs font-medium ${step === i + 1 ? "bg-primary text-primary-foreground" : step > i + 1 ? "bg-accent text-primary" : "text-muted-foreground"}`}>{label}</span>)}</nav>
}

function DesktopStepNav({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-1 pt-2">
      {STEP_LABELS.map((label, i) => {
        const n       = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={label} className={[
            "flex items-center gap-3 px-4 py-3 transition-all",
            current ? "bg-[var(--ds-action)] text-primary-foreground " : done ? "text-[var(--ds-action)]" : "text-muted-foreground",
          ].join(" ")}>
            <div className={[
              "w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0",
              current ? "bg-card text-primary-foreground"
              : done  ? "bg-[var(--ds-action-soft)] text-[var(--ds-action)]"
                      : "bg-muted text-muted-foreground",
            ].join(" ")}>
              {done ? <Check size={12} strokeWidth={3} /> : n}
            </div>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function ClinicInfoCard({ doctors, clinic }: { doctors: DoctorSummary[]; clinic?: PublicClinic }) {
  const phone = clinic?.public_phone ?? clinic?.phone ?? null
  const address = clinic?.address ?? "Consulta la ubicación con tu clínica"
  return (
    <div className="citabox-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="citabox-action flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
          <Activity size={18} className="text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">{clinic?.name ?? BRAND_NAME}</div>
          <div className="text-xs font-medium text-[var(--ds-action)]">Información de la clínica</div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-primary mt-0.5 shrink-0" />
          <span>{address}</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone size={13} className="text-primary mt-0.5 shrink-0" />
          <span>{phone ?? "Solicita los datos de contacto en recepción"}</span>
        </div>
        <div className="flex items-start gap-2">
          <Clock size={13} className="text-primary mt-0.5 shrink-0" />
          <span>Consulta los horarios disponibles en el siguiente paso.</span>
        </div>
      </div>
      {doctors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <div className="flex -space-x-2">
            {doctors.slice(0, 3).map((d, i) => (
              <div key={d.id} className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: getDoctorColor(i), color:"var(--ds-text)" }}>{getDoctorInitials(d)}</div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{doctors.length} especialista{doctors.length !== 1 ? "s" : ""} disponible{doctors.length !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  )
}

function BookingSummaryCard({ booking, service, doctor }: {
  booking: BookingFormData
  service: ServiceSummary | undefined
  doctor: DoctorSummary | undefined
}) {
  if (!service) return null
  return (
    <div className="citabox-action rounded-md p-5 text-primary-foreground ">
      <div className="text-primary-foreground text-xs font-semibold uppercase tracking-widest mb-2">Tu selección</div>
      <div className="font-semibold text-base mb-1">{service.name}</div>
      <div className="text-primary-foreground text-xs mb-3">{formatDuration(service.duration_minutes)} · {formatPrice(service.price)}</div>
      {doctor && <div className="text-sm font-medium mb-1">con {getDoctorDisplayName(doctor)}</div>}
      {booking.date && (
        <div className="text-primary-foreground text-xs">
          {formatDateShort(booking.date)}{booking.time ? ` a las ${formatSlotTime(booking.time)}` : ""}
        </div>
      )}
    </div>
  )
}

// ─── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({ booking, confirmation, service, onHome }: {
  booking: BookingFormData
  confirmation: BookingConfirmation
  service: ServiceSummary | undefined
  onHome: () => void
}) {
  const downloadReminder = () => {
    const icsDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
    const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CitaBox//Solicitud de cita//ES",
      "BEGIN:VEVENT",
      `UID:${confirmation.id}@citabox`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(confirmation.start_time)}`,
      `DTEND:${icsDate(confirmation.end_time)}`,
      `SUMMARY:${escapeText(`Solicitud pendiente: ${confirmation.service?.name ?? service?.name ?? "Consulta"}`)}`,
      "DESCRIPTION:La clínica debe confirmar esta solicitud antes de asistir.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `solicitud-cita-${booking.date}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-card rounded-lg  border border-border p-10 flex flex-col items-center text-center">
        {/* Animated checkmark */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-lg bg-success-bg flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            <div className="w-20 h-20 rounded-lg bg-success-bg flex items-center justify-center">
              <CheckCircle2 size={52} className="text-success" strokeWidth={1.5} />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-9 h-9 rounded-md bg-success flex items-center justify-center  ">
            <Check size={16} className="text-primary-foreground" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-foreground mb-2 text-balance">¡Solicitud de cita recibida!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-1">
          La clínica revisará tu solicitud. Podés consultar el estado por sus canales de contacto.
        </p>
        <p className="mb-4 text-sm font-semibold text-[var(--ds-action)]">Guardá los detalles de tu solicitud.</p>
        <p role="status" className="mb-8 text-sm text-muted-foreground">{appointmentEmailMessage(confirmation.email_confirmation)}</p>

        {/* Summary card */}
        <div className="w-full rounded-lg bg-card border border-border overflow-hidden mb-8 text-left">
          <div className="citabox-action px-5 py-4">
            <div className="text-primary-foreground text-xs font-semibold uppercase tracking-wider mb-0.5">Servicio</div>
            <div className="text-primary-foreground font-semibold text-base">{confirmation.service?.name ?? service?.name ?? "—"}</div>
            {service && (
              <div className="text-primary-foreground text-xs mt-0.5">{formatDuration(service.duration_minutes)} · {formatPrice(service.price)}</div>
            )}
          </div>
          <div className="divide-y divide-border">
            {[
              { label: "Fecha",    value: formatDateLong(booking.date) },
              { label: "Hora",     value: booking.time ? formatSlotTime(booking.time) : "—" },
              { label: "Doctor",   value: `Dr. ${confirmation.doctor.first_name} ${confirmation.doctor.last_name}` },
              { label: "Paciente", value: `${booking.firstName} ${booking.lastName}` },
              { label: "WhatsApp", value: `+506 ${booking.whatsapp}` },
              { label: "Correo", value: booking.email.trim() || "No indicado" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <span className="min-w-0 break-all text-right text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button onClick={downloadReminder} className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-[var(--ds-action)] py-4 text-sm font-semibold text-[var(--ds-action)]  transition-all hover:bg-[var(--ds-action-soft)] active:scale-[.98]">
            <CalendarPlus size={16} />
            Descargar recordatorio
          </button>
          <button
            onClick={onHome}
            className="w-full py-4 rounded-md bg-muted text-foreground font-semibold text-sm hover:bg-muted transition-all active:scale-[.98] "
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 p-3 rounded-md bg-danger-bg border border-danger text-danger text-sm flex items-center gap-2">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button aria-label="Cerrar aviso" onClick={onDismiss} className="ml-auto text-danger hover:text-danger shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Main Wizard Component ─────────────────────────────────────────────────────

export function PatientBookingWizard({
  clinicId,
  clinic,
  onHome,
  initialServiceId = "",
}: {
  clinicId: string
  clinic?: PublicClinic
  onHome: () => void
  initialServiceId?: string
}) {
  const TOTAL = 4
  const [step, setStep]         = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking]   = useState<BookingFormData>({ ...EMPTY_BOOKING, serviceId: initialServiceId })

  // ── API Data ────────────────────────────────────────────────────────────
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [doctors, setDoctors]   = useState<DoctorSummary[]>([])
  const [slots, setSlots]       = useState<TimeSlot[]>([])
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  // When "any" is selected, stores the real doctor UUID from the chosen slot
  const [resolvedDoctorId, setResolvedDoctorId] = useState<string | null>(null)

  // ── Loading & Error ─────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingSlots, setLoadingSlots]     = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const update = (fields: Partial<BookingFormData>) => setBooking(b => ({ ...b, ...fields }))
  const next   = () => { setError(null); setStep(s => Math.min(s + 1, TOTAL)) }
  const back   = () => { setError(null); setStep(s => Math.max(s - 1, 1)) }
  const sanitizeWhatsapp = (value: string) => value.replace(/\D/g, "").slice(0, 8)

  const selectedService = services.find(s => s.id === booking.serviceId)
  const selectedDoctor  = doctors.find(d => d.id === booking.doctorId)

  // ── Fetch services on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const svc = await getServices(clinicId, booking.doctorId)
        if (!cancelled) {
          setServices(svc)
          if (booking.serviceId && !svc.some(service => service.id === booking.serviceId)) {
            setBooking(current => ({
              ...current,
              serviceId: "",
              date: "",
              time: "",
            }))
            setSlots([])
            setResolvedDoctorId(null)
            setStep(1)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar los datos. Intenta de nuevo.")
        }
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clinicId, booking.doctorId, booking.serviceId])

  // ── Re-fetch doctors when a service is selected ─────────────────────────
  useEffect(() => {
    let cancelled = false
    async function loadDoctors() {
      try {
        const doc = await getDoctors(clinicId, booking.serviceId || undefined)
        if (!cancelled) setDoctors(doc)
      } catch {
        // keep existing doctors on error
      }
    }
    loadDoctors()
    return () => { cancelled = true }
  }, [clinicId, booking.serviceId])

  // ── Fetch available slots when doctor + date change ─────────────────────
  useEffect(() => {
    setResolvedDoctorId(null)
    if (!booking.date || !booking.doctorId) {
      setSlots([])
      return
    }
    let cancelled = false
    async function fetchSlots() {
      setLoadingSlots(true)
      setError(null)
      try {
        const res = await getAvailableSlots(
          clinicId,
          booking.doctorId,
          booking.date,
          booking.serviceId || undefined,
        )
        if (!cancelled) setSlots(res.slots)
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setError(err instanceof Error ? err.message : "Error al cargar horarios disponibles.")
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }
    fetchSlots()
    return () => { cancelled = true }
  }, [clinicId, booking.doctorId, booking.date, booking.serviceId])

  const canStep2 = !!(booking.date && booking.time)
  const canStep3 = !!(
    booking.firstName &&
    booking.lastName &&
    booking.cedula &&
    /^\d{8}$/.test(booking.whatsapp) && isValidOptionalEmail(booking.email)
  )

  const handleReservar = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Use the real doctor UUID: resolvedDoctorId (from slot) takes priority over booking.doctorId
      const finalDoctorId = booking.doctorId === "any"
        ? resolvedDoctorId
        : booking.doctorId

      if (!finalDoctorId || finalDoctorId === "any") {
        setError("Por favor selecciona un horario para asignar un doctor.")
        setIsSubmitting(false)
        return
      }

      const conf = await createBooking({
        clinic_id: clinicId,
        service_id: booking.serviceId,
        doctor_id: finalDoctorId,
        date: booking.date,
        time: booking.time,
        first_name: booking.firstName,
        last_name: booking.lastName,
        identification: booking.cedula,
        whatsapp_phone: booking.whatsapp || undefined,
        email: booking.email.trim() || undefined,
      })
      setConfirmation(conf)
      setStep(99)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cita. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }, [clinicId, booking, resolvedDoctorId])

  // ── Success screen ────────────────────────────────────────────────────────

  if (step === 99 && confirmation) {
    return <SuccessScreen booking={booking} confirmation={confirmation} service={selectedService} onHome={onHome} />
  }

  // ── Inline step content ───────────────────────────────────────────────────

  const serviceStepContent = (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1 text-pretty">Servicio y profesional</h2>
      <p className="text-sm text-muted-foreground mb-5">Selecciona un servicio para comenzar</p>
      <ServiceList services={services} loading={initialLoading} selected={booking.serviceId} onSelect={id => update({ serviceId: id })} />
    </div>
  )

  const doctorSectionContent = (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Elige un profesional</p>
      <DoctorGrid doctors={doctors} loading={initialLoading} selected={booking.doctorId} onSelect={id => update({ doctorId: id })} />
    </div>
  )

  const dateStepContent = (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Fecha y hora</h2>
      <p className="text-sm text-muted-foreground mb-5">Elige el día que mejor te convenga</p>
      <MiniCalendar selected={booking.date} onSelect={d => update({ date: d, time: "" })} />
      {booking.date && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Horarios disponibles — {formatDateShort(booking.date)}</p>
          <TimeSlotGrid slots={slots} loading={loadingSlots} selected={booking.time} onSelect={(t, docId) => { update({ time: t }); if (docId) setResolvedDoctorId(docId) }} />
        </div>
      )}
    </div>
  )

  const infoStepContent = (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Tus datos</h2>
      <p className="text-sm text-muted-foreground mb-5">Los usaremos para registrar tu solicitud y contactarte.</p>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-foreground mb-1.5">Nombre</label>
          <input
            id="firstName" autoComplete="given-name"
            type="text"
            placeholder="Ej. Maria"
            value={booking.firstName}
            onChange={e => update({ firstName: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-card border border-input text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all "
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs font-semibold text-foreground mb-1.5">Apellido</label>
          <input
            id="lastName" autoComplete="family-name"
            type="text"
            placeholder="Ej. Fernandez"
            value={booking.lastName}
            onChange={e => update({ lastName: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-card border border-input text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all "
          />
        </div>
        <div>
          <label htmlFor="cedula" className="block text-xs font-semibold text-foreground mb-1.5">Cédula / DIMEX</label>
          <input
            id="cedula"
            type="text"
            placeholder="Ej. 1-2345-6789"
            value={booking.cedula}
            onChange={e => update({ cedula: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-card border border-input text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all "
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="block text-xs font-semibold text-foreground mb-1.5">WhatsApp</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <MessageCircle size={14} className="text-success" />
              <span className="text-muted-foreground text-sm">+506</span>
            </div>
            <input
              id="whatsapp" autoComplete="tel-national"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{8}"
              placeholder="88880000"
              value={booking.whatsapp}
              onChange={e => update({ whatsapp: sanitizeWhatsapp(e.target.value) })}
              className="w-full pl-20 pr-4 py-3.5 rounded-md bg-card border border-input text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all "
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Ingresa 8 dígitos para que la clínica pueda contactarte.</p>
        </div>
        <div>
          <label htmlFor="booking-email" className="mb-1.5 block text-xs font-semibold text-foreground">Correo electrónico (opcional)</label>
          <Input id="booking-email" type="email" autoComplete="email" maxLength={254} value={booking.email} onChange={e => update({ email: e.target.value })} aria-describedby="booking-email-help" aria-invalid={!isValidOptionalEmail(booking.email)} />
          <p id="booking-email-help" className="mt-1.5 text-xs text-muted-foreground">{isValidOptionalEmail(booking.email) ? "Recibirás un comprobante de la solicitud. La clínica debe confirmar la cita antes de que asistas." : "Revisa el correo electrónico antes de continuar."}</p>
        </div>
      </div>
    </div>
  )

  const reviewStepContent = (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Revisa tu cita</h2>
      <p className="text-sm text-muted-foreground mb-5">¿Todo se ve bien?</p>
      <div className="overflow-hidden rounded-md border border-border bg-card ">
        <div className="citabox-action px-5 py-4">
          <div className="text-primary-foreground text-xs font-semibold uppercase tracking-wider mb-0.5">Servicio</div>
          <div className="text-primary-foreground font-semibold text-base">{selectedService?.name ?? "—"}</div>
          {selectedService && (
            <div className="text-primary-foreground text-xs mt-0.5">{formatDuration(selectedService.duration_minutes)} · {formatPrice(selectedService.price)}</div>
          )}
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Fecha",    value: formatDateShort(booking.date) ?? "—" },
            { label: "Hora",     value: booking.time ? formatSlotTime(booking.time) : "—" },
            { label: "Doctor",   value: selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "Disponible" },
            { label: "Paciente", value: `${booking.firstName} ${booking.lastName}` },
            { label: "Cédula",   value: booking.cedula },
            { label: "WhatsApp", value: `+506 ${booking.whatsapp}` },
            { label: "Correo", value: booking.email.trim() || "No indicado" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <span className="min-w-0 break-all text-right text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-4 leading-relaxed">
        La clínica revisará la solicitud y te indicará cómo confirmar, cancelar o reprogramar la cita.
      </p>
    </div>
  )

  // ── CTA / Submit button ───────────────────────────────────────────────────

  const ctaConfig: Record<number, { label: string; disabled: boolean; action: () => void }> = {
    1: { label: "Continuar", disabled: !selectedService || initialLoading, action: next },
    2: { label: "Continuar",        disabled: !canStep2,  action: next },
    3: { label: "Revisar Cita",     disabled: !canStep3,  action: next },
    4: { label: "Reservar",         disabled: false,      action: handleReservar },
  }

  const renderCTA = () => {
    const cfg = ctaConfig[step]
    if (!cfg) return null
    return (
      <button
        disabled={cfg.disabled || isSubmitting}
        onClick={cfg.action}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-md py-4 text-base font-semibold  transition-all active:scale-[.98]",
          step === 4 ? "text-lg py-5" : "",
          cfg.disabled || isSubmitting
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "citabox-action text-primary-foreground   hover:brightness-95",
        ].join(" ")}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : cfg.label}
      </button>
    )
  }

  const headerBar = (
    <div className="flex items-center justify-between mb-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="citabox-action flex h-9 w-9 items-center justify-center rounded-md">
          <Activity size={15} className="text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground text-sm">{clinic?.name ?? BRAND_NAME}</span>
      </div>
      {step === 1 && <button onClick={onHome} className="rounded-md px-3 py-2 text-sm font-medium text-primary">Servicios</button>}
      {step > 1 && (
        <button
          onClick={back}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground px-3 py-2 rounded-md bg-primary border border-border hover:bg-primary transition-all"
        >
          <ChevronLeft size={14} />
          Atrás
        </button>
      )}
    </div>
  )

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────

  const mobileView = (
    <div className="citabox-shell flex min-h-screen items-start justify-center px-4 pb-16 pt-8 font-sans xl:hidden">
      <h1 className="sr-only">Reserva una cita en {clinic?.name ?? BRAND_NAME}</h1>
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-md bg-card " style={{ minHeight: "calc(100dvh - 3rem)" }}>
        <div className="flex-shrink-0 bg-card px-5 pb-4 pt-5 ">
          {headerBar}
          <StepPillBar step={step} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-36 pt-3">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              {serviceStepContent}
              {doctorSectionContent}
            </div>
          )}
          {step === 2 && dateStepContent}
          {step === 3 && infoStepContent}
          {step === 4 && reviewStepContent}
        </div>

        {step >= 1 && (
          <div className="sticky bottom-0">
            <div className="bg-card px-5 pb-6 pt-4">
              {renderCTA()}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────

  const desktopView = (
    <div className="citabox-shell hidden min-h-screen font-sans xl:flex">
      <aside className="flex w-72 shrink-0 flex-col rounded-md border-r border-border bg-card px-5 py-8 ">
        <div className="flex items-center gap-3 mb-10">
          <div className="citabox-action flex h-11 w-11 items-center justify-center rounded-md">
            <Activity size={18} className="text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm leading-tight">{clinic?.name ?? BRAND_NAME}</div>
            <div className="text-xs font-semibold text-[var(--ds-action)]">Reservas</div>
          </div>
        </div>

        <DesktopStepNav step={step} />

        <div className="mt-auto pt-8 flex flex-col gap-3">
          {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
          <ClinicInfoCard doctors={doctors} clinic={clinic} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agendar una cita</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{clinic?.name ?? BRAND_NAME}{clinic?.address ? ` - ${clinic.address}` : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <StepPillBar step={step} />
            {step === 1 && <button onClick={onHome} className="rounded-md px-3 py-2 text-sm font-medium text-primary">Volver a servicios</button>}
            {step > 1 && (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground px-4 py-2 rounded-md bg-primary border border-border hover:bg-primary transition-all"
              >
                <ChevronLeft size={14} />Atrás
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="citabox-panel col-span-2 p-6">
              {serviceStepContent}<div className="mt-6">{renderCTA()}</div>
            </div>
            <div className="flex flex-col gap-5">
              <div className="citabox-panel p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Elige un profesional</p>
                <DoctorGrid doctors={doctors} loading={initialLoading} selected={booking.doctorId} onSelect={id => update({ doctorId: id })} compact />
              </div>
              <ClinicInfoCard doctors={doctors} clinic={clinic} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-1 flex flex-col gap-5">
              <div className="citabox-panel p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Selecciona una fecha</h2>
                <p className="text-xs text-muted-foreground mb-4">Elige el día que mejor te convenga</p>
                <MiniCalendar selected={booking.date} onSelect={d => update({ date: d, time: "" })} />
              </div>
            </div>
            <div className="citabox-panel col-span-2 flex flex-col p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Horarios disponibles</h2>
              <p className="text-xs text-muted-foreground mb-5">
                {booking.date ? `Espacios para ${formatDateShort(booking.date)}` : "Selecciona una fecha primero"}
              </p>
              {booking.date
                ? <TimeSlotGrid slots={slots} loading={loadingSlots} selected={booking.time} onSelect={(t, docId) => { update({ time: t }); if (docId) setResolvedDoctorId(docId) }} />
                : <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">← Elige una fecha</div>
              }
              <div className="mt-auto pt-6">{renderCTA()}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="citabox-panel col-span-2 p-8">
              {infoStepContent}
              <div className="mt-6">{renderCTA()}</div>
            </div>
            <div className="flex flex-col gap-5">
              {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
              <ClinicInfoCard doctors={doctors} clinic={clinic} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="citabox-panel col-span-2 p-8">
              {reviewStepContent}
              <div className="mt-6">{renderCTA()}</div>
            </div>
            <div className="flex flex-col gap-5">
              {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
              <ClinicInfoCard doctors={doctors} clinic={clinic} />
            </div>
          </div>
        )}
      </main>
    </div>
  )

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  )
}
