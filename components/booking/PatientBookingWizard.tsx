"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Smile,
  FlaskConical,
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
} from "@/types/api"
import {
  getServices,
  getDoctors,
  getAvailableSlots,
  createBooking,
} from "@/services/booking.service"

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Service","Date","Info","Review"]
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
const AVATAR_COLORS = ["#5EEAD4", "#7DD3FC", "#FDE68A", "#DDA0DD", "#96CEB4", "#FF6B6B", "#4ECDC4"]

const EMPTY_BOOKING: BookingFormData = {
  serviceId: "", doctorId: "any", date: "", time: "",
  firstName: "", lastName: "", cedula: "", whatsapp: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDoctorColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getDoctorInitials(doc: DoctorSummary): string {
  return `${doc.first_name?.[0] ?? ""}${doc.last_name?.[0] ?? ""}`.toUpperCase()
}

function formatPrice(price: number): string {
  return `₡${price.toLocaleString("es-CR")}`
}

function formatDuration(minutes: number): string {
  return `${minutes} min`
}

function formatDateShort(iso: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-")
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-CR", { weekday: "short", month: "short", day: "numeric" })
}

function formatDateLong(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-CR", { weekday: "long", month: "long", day: "numeric" })
}

function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`
}

function getDoctorDisplayName(doc: DoctorSummary): string {
  if (doc.id === "any") return "Any Available"
  return `Dr. ${doc.first_name} ${doc.last_name?.[0] ?? ""}.`
}

function getServiceIcon(name: string): React.ReactNode {
  const n = name.toLowerCase()
  if (n.includes("check") || n.includes("clean") || n.includes("limpieza") || n.includes("general"))
    return <Stethoscope size={20} />
  if (n.includes("whiten") || n.includes("blanqueamiento") || n.includes("estétic"))
    return <Sparkles size={20} />
  if (n.includes("consult") || n.includes("primera") || n.includes("evaluación"))
    return <ShieldCheck size={20} />
  if (n.includes("ortho") || n.includes("braces") || n.includes("ortodon"))
    return <Smile size={20} />
  if (n.includes("implant"))
    return <FlaskConical size={20} />
  return <Stethoscope size={20} />
}

// ─── Sub-Components (defined OUTSIDE main component to prevent remount) ────────

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const [vm, setVm] = useState(TODAY.getMonth())
  const vy = TODAY.getFullYear()

  const firstDay    = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const label       = new Date(vy, vm).toLocaleString("en-US", { month: "long", year: "numeric" })
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const iso  = (d: number) => `${vy}-${String(vm + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
  const past = (d: number) => new Date(vy, vm, d) < TODAY

  return (
    <div className="rounded-lg bg-white border border-slate-100 shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setVm(m => Math.max(m - 1, TODAY.getMonth()))}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
        ><ChevronLeft size={14} /></button>
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <button
          onClick={() => setVm(m => m + 1)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
        ><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
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
              disabled={isPast}
              onClick={() => onSelect(key)}
              className={[
                "w-8 h-8 mx-auto rounded-md text-xs font-semibold flex items-center justify-center transition-all",
                isPast ? "text-slate-200 cursor-not-allowed"
                : isSel ? "bg-[#008BB0] text-white shadow-md"
                        : "text-slate-700 hover:bg-teal-50 hover:text-teal-700",
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
  const ANY_OPTION: DoctorSummary = { id: "any", first_name: "Any", last_name: "Available", specialty: "We'll match you" }
  const allDoctors = [ANY_OPTION, ...doctors]

  if (loading) {
    return (
      <div className={compact ? "grid grid-cols-4 gap-2" : "flex gap-3 overflow-x-auto pb-1"}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
            <div className="w-14 h-2.5 bg-slate-100 rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={compact ? "grid grid-cols-4 gap-2" : "flex gap-3 overflow-x-auto pb-1"}>
      {allDoctors.map((doc, idx) => {
        const color = doc.id === "any" ? "#CBD5E1" : getDoctorColor(idx - 1)
        const initials = doc.id === "any" ? "?" : getDoctorInitials(doc)
        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 transition-all active:scale-95"
          >
            <div
              className={[
                "w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-all",
                selected === doc.id ? "border-teal-600 scale-105 shadow-lg" : "border-transparent opacity-80 hover:opacity-100",
              ].join(" ")}
              style={{ backgroundColor: color, color: "#1e293b" }}
            >{initials}</div>
            <div className="text-center w-16">
              <div className="text-[11px] font-semibold text-slate-700 truncate">
                {doc.id === "any" ? "Any" : doc.first_name}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight truncate">
                {doc.id === "any" ? "Available" : (doc.specialty?.split(" ")[0] ?? "")}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ServiceList({ services, selected, onSelect, loading = false }: {
  services: ServiceSummary[]
  selected: string
  onSelect: (id: string) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-full flex items-center gap-3.5 p-4 rounded-lg border-2 border-slate-100 bg-white shadow-sm">
            <div className="w-11 h-11 rounded-md bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-16 ml-auto" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-12 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No hay servicios disponibles en este momento.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {services.map(svc => (
        <button
          key={svc.id}
          onClick={() => onSelect(svc.id)}
          className={[
            "w-full flex items-center gap-3.5 p-4 rounded-lg border-2 text-left transition-all active:scale-[.98]",
            selected === svc.id
              ? "border-teal-600 bg-teal-50 shadow-md"
              : "border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/40 shadow-sm",
          ].join(" ")}
        >
          <div className={[
            "w-11 h-11 rounded-md flex items-center justify-center shrink-0",
            selected === svc.id ? "bg-[#008BB0] text-white" : "bg-slate-100 text-teal-700",
          ].join(" ")}>{getServiceIcon(svc.name)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800 text-sm leading-tight">{svc.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{svc.description ?? ""}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-teal-700">{formatPrice(svc.price)}</div>
            <div className="text-[10px] text-slate-400">{formatDuration(svc.duration_minutes)}</div>
          </div>
        </button>
      ))}
    </div>
  )
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
          <div key={i} className="h-10 rounded-md bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
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
              !slot.available ? "bg-slate-50 text-slate-300 cursor-not-allowed line-through"
              : isSel  ? "bg-[#008BB0] text-white shadow-md"
                       : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700",
            ].join(" ")}
          >{formatSlotTime(slot.time)}</button>
        )
      })}
    </div>
  )
}

function StepPillBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const n       = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={label} className="flex items-center gap-1">
            <div className={[
              "text-[11px] font-semibold px-2.5 py-1 transition-all",
              done    ? "bg-teal-100 text-teal-700"
              : current ? "bg-[#008BB0] text-white"
                        : "text-slate-400",
            ].join(" ")}>
              {done ? <Check size={10} className="inline" strokeWidth={3} /> : null} {label}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={["w-3 h-px", done ? "bg-teal-400" : "bg-slate-200"].join(" ")} />
            )}
          </div>
        )
      })}
    </div>
  )
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
            current ? "bg-[#008BB0] text-white shadow-md" : done ? "text-teal-600" : "text-slate-400",
          ].join(" ")}>
            <div className={[
              "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
              current ? "bg-white/20 text-white"
              : done  ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-400",
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

function ClinicInfoCard({ doctors }: { doctors: DoctorSummary[] }) {
  return (
    <div className="rounded-lg bg-white border border-slate-100 shadow-md p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-[#008BB0] flex items-center justify-center shrink-0">
          <Smile size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm">Clínica Dental DRC</div>
          <div className="text-xs text-teal-600 font-medium">Verified Clinic</div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 text-xs text-slate-500">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-teal-500 mt-0.5 shrink-0" />
          <span>San José, Costa Rica · Barrio El Carmen</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone size={13} className="text-teal-500 mt-0.5 shrink-0" />
          <span>+506 2222-3344</span>
        </div>
        <div className="flex items-start gap-2">
          <Clock size={13} className="text-teal-500 mt-0.5 shrink-0" />
          <span>Lun – Vie: 8 AM – 5 PM<br />Sáb: 8 AM – 12 PM</span>
        </div>
      </div>
      {doctors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <div className="flex -space-x-2">
            {doctors.slice(0, 3).map((d, i) => (
              <div key={d.id} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: getDoctorColor(i), color:"#1e293b" }}>{getDoctorInitials(d)}</div>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">{doctors.length} especialista{doctors.length !== 1 ? "s" : ""} disponible{doctors.length !== 1 ? "s" : ""}</span>
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
    <div className="rounded-lg bg-[#008BB0] text-white p-5 shadow-md">
      <div className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mb-2">Tu selección</div>
      <div className="font-bold text-base mb-1">{service.name}</div>
      <div className="text-teal-200 text-xs mb-3">{formatDuration(service.duration_minutes)} · {formatPrice(service.price)}</div>
      {doctor && <div className="text-sm font-medium mb-1">con {getDoctorDisplayName(doctor)}</div>}
      {booking.date && (
        <div className="text-teal-200 text-xs">
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
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-100 p-10 flex flex-col items-center text-center">
        {/* Animated checkmark */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-lg bg-emerald-50 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            <div className="w-20 h-20 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={52} className="text-emerald-500 drop-shadow-md" strokeWidth={1.5} />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-9 h-9 rounded-md bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Check size={16} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-balance">¡Cita Confirmada!</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-1">
          Hemos enviado los detalles a tu WhatsApp.
        </p>
        <p className="text-teal-700 font-bold text-sm mb-8">Te esperamos.</p>

        {/* Summary card */}
        <div className="w-full rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-8 text-left">
          <div className="bg-[#008BB0] px-5 py-4">
            <div className="text-teal-200 text-xs font-semibold uppercase tracking-wider mb-0.5">Servicio</div>
            <div className="text-white font-bold text-base">{confirmation.service?.name ?? service?.name ?? "—"}</div>
            {service && (
              <div className="text-teal-200 text-xs mt-0.5">{formatDuration(service.duration_minutes)} · {formatPrice(service.price)}</div>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: "Fecha",    value: formatDateLong(booking.date) },
              { label: "Hora",     value: booking.time ? formatSlotTime(booking.time) : "—" },
              { label: "Doctor",   value: `Dr. ${confirmation.doctor.first_name} ${confirmation.doctor.last_name}` },
              { label: "Paciente", value: `${booking.firstName} ${booking.lastName}` },
              { label: "WhatsApp", value: `+506 ${booking.whatsapp}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs text-slate-400 font-medium">{label}</span>
                <span className="text-sm font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button className="w-full py-4 rounded-md border-2 border-teal-700 text-teal-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-50 transition-all active:scale-[.98] shadow-sm">
            <CalendarPlus size={16} />
            Agregar al Calendario
          </button>
          <button
            onClick={onHome}
            className="w-full py-4 rounded-md bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all active:scale-[.98] shadow-sm"
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
    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600 shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Main Wizard Component ─────────────────────────────────────────────────────

export function PatientBookingWizard({ clinicId, onHome }: { clinicId: string; onHome: () => void }) {
  const TOTAL = 4
  const [step, setStep]         = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking]   = useState<BookingFormData>({ ...EMPTY_BOOKING })

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

  const selectedService = services.find(s => s.id === booking.serviceId)
  const selectedDoctor  = doctors.find(d => d.id === booking.doctorId)

  // ── Fetch services on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const svc = await getServices(clinicId)
        if (!cancelled) {
          setServices(svc)
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
  }, [clinicId])

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
  const canStep3 = !!(booking.firstName && booking.lastName && booking.cedula && booking.whatsapp)

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
      <h2 className="text-xl font-bold text-slate-900 mb-1 text-pretty">¿Con qué podemos ayudarte hoy?</h2>
      <p className="text-sm text-slate-500 mb-5">Selecciona un servicio para comenzar</p>
      <ServiceList services={services} loading={initialLoading} selected={booking.serviceId} onSelect={id => { update({ serviceId: id }); next() }} />
    </div>
  )

  const doctorSectionContent = (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Elige un profesional</p>
      <DoctorGrid doctors={doctors} loading={initialLoading} selected={booking.doctorId} onSelect={id => update({ doctorId: id })} />
    </div>
  )

  const dateStepContent = (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Selecciona Fecha y Hora</h2>
      <p className="text-sm text-slate-500 mb-5">Elige el día que mejor te convenga</p>
      <MiniCalendar selected={booking.date} onSelect={d => update({ date: d, time: "" })} />
      {booking.date && (
        <div className="mt-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Horarios disponibles — {formatDateShort(booking.date)}</p>
          <TimeSlotGrid slots={slots} loading={loadingSlots} selected={booking.time} onSelect={(t, docId) => { update({ time: t }); if (docId) setResolvedDoctorId(docId) }} />
        </div>
      )}
    </div>
  )

  const infoStepContent = (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Tus Datos</h2>
      <p className="text-sm text-slate-500 mb-5">Los usaremos para confirmar tu cita</p>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="firstName" className="block text-xs font-bold text-slate-600 mb-1.5">Nombre</label>
          <input
            id="firstName"
            type="text"
            placeholder="Ej. Maria"
            value={booking.firstName}
            onChange={e => update({ firstName: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-white border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs font-bold text-slate-600 mb-1.5">Apellido</label>
          <input
            id="lastName"
            type="text"
            placeholder="Ej. Fernandez"
            value={booking.lastName}
            onChange={e => update({ lastName: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-white border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="cedula" className="block text-xs font-bold text-slate-600 mb-1.5">Cédula / DIMEX</label>
          <input
            id="cedula"
            type="text"
            placeholder="Ej. 1-2345-6789"
            value={booking.cedula}
            onChange={e => update({ cedula: e.target.value })}
            className="w-full px-4 py-3.5 rounded-md bg-white border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="block text-xs font-bold text-slate-600 mb-1.5">WhatsApp</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <MessageCircle size={14} className="text-green-500" />
              <span className="text-slate-400 text-sm">+506</span>
            </div>
            <input
              id="whatsapp"
              type="tel"
              placeholder="8888-0000"
              value={booking.whatsapp}
              onChange={e => update({ whatsapp: e.target.value })}
              className="w-full pl-20 pr-4 py-3.5 rounded-md bg-white border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Te enviaremos tu confirmación aquí</p>
        </div>
      </div>
    </div>
  )

  const reviewStepContent = (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Revisa los Detalles</h2>
      <p className="text-sm text-slate-500 mb-5">¿Todo se ve bien?</p>
      <div className="rounded-lg bg-white shadow-md overflow-hidden border border-slate-100">
        <div className="bg-[#008BB0] px-5 py-4">
          <div className="text-teal-200 text-xs font-semibold uppercase tracking-wider mb-0.5">Servicio</div>
          <div className="text-white font-bold text-base">{selectedService?.name ?? "—"}</div>
          {selectedService && (
            <div className="text-teal-200 text-xs mt-0.5">{formatDuration(selectedService.duration_minutes)} · {formatPrice(selectedService.price)}</div>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: "Fecha",    value: formatDateShort(booking.date) ?? "—" },
            { label: "Hora",     value: booking.time ? formatSlotTime(booking.time) : "—" },
            { label: "Doctor",   value: selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "Disponible" },
            { label: "Paciente", value: `${booking.firstName} ${booking.lastName}` },
            { label: "Cédula",   value: booking.cedula },
            { label: "WhatsApp", value: `+506 ${booking.whatsapp}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <span className="text-sm font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-center text-slate-400 mt-4 leading-relaxed">
        Al confirmar aceptas nuestra política de cancelación. Puedes cancelar o reprogramar hasta 2 horas antes.
      </p>
    </div>
  )

  // ── CTA / Submit button ───────────────────────────────────────────────────

  const ctaConfig: Record<number, { label: string; disabled: boolean; action: () => void }> = {
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
          "w-full py-4 rounded-md font-bold text-base transition-all active:scale-[.98] flex items-center justify-center gap-2 shadow-sm",
          step === 4 ? "text-lg py-5" : "",
          cfg.disabled || isSubmitting
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-[#008BB0] text-white shadow-lg shadow-[#008BB0]/20 hover:bg-[#007199]",
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
        <div className="w-8 h-8 rounded-md bg-[#008BB0] flex items-center justify-center">
          <Smile size={15} className="text-white" />
        </div>
        <span className="font-bold text-slate-800 text-sm">Clínica Dental DRC</span>
      </div>
      {step > 1 && (
        <button
          onClick={back}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-md bg-slate-700 border border-slate-700 hover:bg-slate-800 transition-all"
        >
          <ChevronLeft size={14} />
          Atrás
        </button>
      )}
    </div>
  )

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────

  const mobileView = (
    <div className="md:hidden min-h-screen bg-slate-100 flex items-start justify-center pt-8 pb-16 px-4 font-sans">
      <div className="w-full max-w-sm bg-slate-50 rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ minHeight: 780 }}>
        <div className="bg-slate-50/95 backdrop-blur-sm px-5 pt-5 pb-4 flex-shrink-0">
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

        {step > 1 && (
          <div className="sticky bottom-0">
            <div className="px-5 pb-6 pt-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent">
              {renderCTA()}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────

  const desktopView = (
    <div className="hidden md:flex min-h-screen bg-slate-100 font-sans">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col px-5 py-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-md bg-[#008BB0] flex items-center justify-center">
            <Smile size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight">Clínica Dental</div>
            <div className="text-teal-600 font-semibold text-xs">DRC</div>
          </div>
        </div>

        <DesktopStepNav step={step} />

        <div className="mt-auto pt-8 flex flex-col gap-3">
          {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
          <ClinicInfoCard doctors={doctors} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agendar una Cita</h1>
            <p className="text-sm text-slate-500 mt-0.5">Clínica Dental DRC — San José, Costa Rica</p>
          </div>
          <div className="flex items-center gap-3">
            <StepPillBar step={step} />
            {step > 1 && (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-md bg-slate-700 border border-slate-700 hover:bg-slate-800 transition-all"
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
            <div className="col-span-2 bg-white rounded-lg shadow-md border border-slate-100 p-6">
              {serviceStepContent}
            </div>
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Elige un profesional</p>
                <DoctorGrid doctors={doctors} loading={initialLoading} selected={booking.doctorId} onSelect={id => update({ doctorId: id })} compact />
              </div>
              <ClinicInfoCard doctors={doctors} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-1 flex flex-col gap-5">
              <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Selecciona una Fecha</h2>
                <p className="text-xs text-slate-500 mb-4">Elige el día que mejor te convenga</p>
                <MiniCalendar selected={booking.date} onSelect={d => update({ date: d, time: "" })} />
              </div>
            </div>
            <div className="col-span-2 bg-white rounded-lg shadow-md border border-slate-100 p-6 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Horarios Disponibles</h2>
              <p className="text-xs text-slate-500 mb-5">
                {booking.date ? `Espacios para ${formatDateShort(booking.date)}` : "Selecciona una fecha primero"}
              </p>
              {booking.date
                ? <TimeSlotGrid slots={slots} loading={loadingSlots} selected={booking.time} onSelect={(t, docId) => { update({ time: t }); if (docId) setResolvedDoctorId(docId) }} />
                : <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">← Elige una fecha</div>
              }
              <div className="mt-auto pt-6">{renderCTA()}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-lg shadow-md border border-slate-100 p-8">
              {infoStepContent}
              <div className="mt-6">{renderCTA()}</div>
            </div>
            <div className="flex flex-col gap-5">
              {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
              <ClinicInfoCard doctors={doctors} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-lg shadow-md border border-slate-100 p-8">
              {reviewStepContent}
              <div className="mt-6">{renderCTA()}</div>
            </div>
            <div className="flex flex-col gap-5">
              {booking.serviceId && <BookingSummaryCard booking={booking} service={selectedService} doctor={selectedDoctor} />}
              <ClinicInfoCard doctors={doctors} />
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
