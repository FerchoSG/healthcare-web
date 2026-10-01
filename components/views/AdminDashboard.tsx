"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Clock3,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  formatClinicDateFromKey,
  formatClinicDateKey,
  formatClinicDateTime,
  formatClinicTime,
  getClinicTodayKey,
  parseClinicDateKey,
} from "@/lib/clinic-time"
import { AppointmentStatus, type Appointment, type KPIs, type Patient, type RevenueDataPoint } from "@/types/api"
import { fetchTodayAppointments } from "@/services/appointments.service"
import { fetchKpis, fetchRevenue } from "@/services/analytics.service"
import { fetchPatients } from "@/services/patients.service"

interface AdminDashboardProps {
  onViewPatients: () => void
}

type DashboardState = {
  appointments: Appointment[]
  patients: Patient[]
  kpis: KPIs | null
  revenue: RevenueDataPoint[]
}

const initialState: DashboardState = {
  appointments: [],
  patients: [],
  kpis: null,
  revenue: [],
}

const statusMeta: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  [AppointmentStatus.PENDING]: {
    label: "Pendiente",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  [AppointmentStatus.CONFIRMED]: {
    label: "Confirmada",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  [AppointmentStatus.WAITING]: {
    label: "En espera",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  [AppointmentStatus.IN_CONSULTATION]: {
    label: "En consulta",
    className: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  [AppointmentStatus.COMPLETED]: {
    label: "Completada",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  [AppointmentStatus.CANCELLED]: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es-CR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatTime(value: string) {
  return formatClinicTime(value)
}

function formatDate(value: string) {
  return formatClinicDateFromKey(value, { month: "short", day: "numeric" })
}

function getInitials(patient: Patient) {
  return `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase()
}

function getAvatarColor(patient: Patient) {
  const colors = ["#0F766E", "#334155", "#1D4ED8", "#7C3AED", "#B45309", "#BE123C"]
  const name = `${patient.first_name}${patient.last_name}`
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function buildRevenueSeries(revenue: RevenueDataPoint[]) {
  const byDate = new Map(revenue.map((point) => [point.date, point.total]))
  return Array.from({ length: 14 }, (_, index) => {
    const date = parseClinicDateKey(getClinicTodayKey())
    date.setUTCDate(date.getUTCDate() - (13 - index))
    const key = formatClinicDateKey(date)
    return {
      date: key,
      label: formatDate(key),
      total: byDate.get(key) ?? 0,
    }
  })
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(Number(payload[0].value ?? 0))}</p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
}) {
  return (
    <div className="citabox-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function Panel({
  title,
  meta,
  action,
  children,
  className = "",
}: {
  title: string
  meta?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`citabox-panel overflow-hidden ${className}`}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function AdminDashboard({ onViewPatients }: AdminDashboardProps) {
  const [state, setState] = useState<DashboardState>(initialState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [appointments, kpis, revenue, patients] = await Promise.all([
        fetchTodayAppointments(),
        fetchKpis(),
        fetchRevenue(),
        fetchPatients({ page: 1, limit: 5 }),
      ])

      setState({
        appointments,
        kpis,
        revenue,
        patients: patients.data,
      })
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el panel.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const revenueSeries = useMemo(() => buildRevenueSeries(state.revenue), [state.revenue])
  const waitingCount = state.appointments.filter((a) => a.status === AppointmentStatus.WAITING).length
  const activeCount = state.appointments.filter((a) => a.status === AppointmentStatus.IN_CONSULTATION).length
  const completedCount = state.appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length
  const nextAppointments = state.appointments
    .filter((a) => a.status !== AppointmentStatus.CANCELLED)
    .slice(0, 7)

  const monthRevenue = state.kpis?.revenue_this_month ?? 0
  const newPatients = state.kpis?.new_patients_this_month ?? 0
  const appointmentsToday = state.kpis?.appointments_today ?? state.appointments.length

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-[24px] bg-white/35 dark:bg-[color-mix(in_srgb,var(--background)_70%,transparent)]">
      <div className="flex flex-col gap-5 p-1 lg:p-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-navy)]">{formatClinicDateFromKey(getClinicTodayKey(), { weekday: "long", month: "long", day: "numeric" })}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Dashboard de CitaBox</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Actualizado {formatClinicTime(lastUpdated.toISOString())}
              </p>
            )}
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-[var(--brand-navy-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950 dark:text-red-300">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Citas"
            value={loading ? "..." : String(appointmentsToday)}
            helper={`${waitingCount} en espera, ${activeCount} activas`}
            icon={<CalendarCheck size={16} />}
          />
          <MetricCard
            label="Pacientes nuevos"
            value={loading ? "..." : String(newPatients)}
            helper="Registrados este mes"
            icon={<Users size={16} />}
          />
          <MetricCard
            label="Ingresos"
            value={loading ? "..." : formatCompact(monthRevenue)}
            helper={formatCurrency(monthRevenue)}
            icon={<DollarSign size={16} />}
          />
          <MetricCard
            label="Consultas completadas"
            value={loading ? "..." : String(completedCount)}
            helper="Listas para seguimiento"
            icon={<TrendingUp size={16} />}
          />
        </div>

        <div className="grid min-h-[390px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
          <Panel title="Ingresos" meta="Últimos 14 días" action={<span className="text-xs font-medium text-muted-foreground">CRC</span>}>
            <div className="h-[314px] px-2 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 20, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis hide />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--border)" }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#adminRevenue)"
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Agenda de hoy" meta="Citas activas" action={<Clock3 size={16} className="text-muted-foreground" />}>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Cargando agenda...</span>
              </div>
            ) : nextAppointments.length === 0 ? (
              <p className="py-20 text-center text-xs text-muted-foreground">No hay citas programadas para hoy.</p>
            ) : (
              <div className="overflow-hidden">
                <div className="grid grid-cols-[72px_minmax(0,1fr)_96px] border-b border-border bg-[var(--surface-soft)] px-4 py-2 text-[11px] font-bold uppercase text-muted-foreground">
                  <span>Hora</span>
                  <span>Paciente</span>
                  <span className="text-right">Estado</span>
                </div>
                <div className="divide-y divide-border">
                  {nextAppointments.map((appointment) => {
                    const meta = statusMeta[appointment.status]
                    return (
                      <div key={appointment.id} className="grid grid-cols-[72px_minmax(0,1fr)_96px] items-center gap-3 px-4 py-3">
                        <span className="text-xs font-semibold text-foreground">{formatTime(appointment.start_time)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {appointment.patient.first_name} {appointment.patient.last_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {appointment.reason ?? appointment.service?.name ?? "Cita"}
                          </p>
                        </div>
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2 py-1 text-[10px] font-bold ${meta.className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.15fr)]">
          <Panel
            title="Pacientes recientes"
            meta="Registros más nuevos"
            action={
              <button
                onClick={onViewPatients}
                className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-xs font-bold text-[var(--brand-navy)] hover:bg-[var(--brand-navy-soft)]"
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            }
          >
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-8 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Cargando pacientes...
              </div>
            ) : state.patients.length === 0 ? (
              <p className="px-4 py-8 text-xs text-muted-foreground">No hay pacientes recientes.</p>
            ) : (
              <div className="divide-y divide-border">
                {state.patients.map((patient) => (
                  <div key={patient.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[11px] font-bold text-white"
                      style={{ backgroundColor: getAvatarColor(patient) }}
                    >
                      {getInitials(patient)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{patient.identification}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatClinicDateTime(patient.createdAt, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Estado operativo" meta="Situación actual de la clínica">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Presión de agenda</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{waitingCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">pacientes en espera</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">En consulta</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{activeCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">consultorios activos</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Pendientes de cierre</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{completedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">consultas completadas</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
