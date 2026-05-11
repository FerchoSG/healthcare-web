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
    label: "Pending",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  [AppointmentStatus.CONFIRMED]: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  [AppointmentStatus.WAITING]: {
    label: "Waiting",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  [AppointmentStatus.IN_CONSULTATION]: {
    label: "In consult",
    className: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  [AppointmentStatus.COMPLETED]: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  [AppointmentStatus.CANCELLED]: {
    label: "Cancelled",
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
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
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
    const date = new Date()
    date.setDate(date.getDate() - (13 - index))
    const key = date.toISOString().slice(0, 10)
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
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
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
    <section className={`rounded-md border border-border bg-card shadow-sm ${className}`}>
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
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
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
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{formatFullDate(new Date())}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950 dark:text-red-300">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Appointments"
            value={loading ? "..." : String(appointmentsToday)}
            helper={`${waitingCount} waiting, ${activeCount} active`}
            icon={<CalendarCheck size={16} />}
          />
          <MetricCard
            label="New Patients"
            value={loading ? "..." : String(newPatients)}
            helper="Created this month"
            icon={<Users size={16} />}
          />
          <MetricCard
            label="Revenue"
            value={loading ? "..." : formatCompact(monthRevenue)}
            helper={formatCurrency(monthRevenue)}
            icon={<DollarSign size={16} />}
          />
          <MetricCard
            label="Completed Visits"
            value={loading ? "..." : String(completedCount)}
            helper="Ready for review"
            icon={<TrendingUp size={16} />}
          />
        </div>

        <div className="grid min-h-[390px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
          <Panel title="Revenue" meta="Last 14 days" action={<span className="text-xs font-medium text-muted-foreground">CRC</span>}>
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

          <Panel title="Today&apos;s Queue" meta="Active schedule" action={<Clock3 size={16} className="text-muted-foreground" />}>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Loading schedule...</span>
              </div>
            ) : nextAppointments.length === 0 ? (
              <p className="py-20 text-center text-xs text-muted-foreground">No appointments scheduled today</p>
            ) : (
              <div className="overflow-hidden">
                <div className="grid grid-cols-[72px_minmax(0,1fr)_96px] border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase text-muted-foreground">
                  <span>Time</span>
                  <span>Patient</span>
                  <span className="text-right">Status</span>
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
                            {appointment.reason ?? appointment.service?.name ?? "Appointment"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${meta.className}`}>
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.15fr)]">
          <Panel
            title="Recent Patients"
            meta="Newest records"
            action={
              <button
                onClick={onViewPatients}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
              >
                View all
                <ArrowRight size={13} />
              </button>
            }
          >
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-8 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Loading patients...
              </div>
            ) : state.patients.length === 0 ? (
              <p className="px-4 py-8 text-xs text-muted-foreground">No recent patients found</p>
            ) : (
              <div className="divide-y divide-border">
                {state.patients.map((patient) => (
                  <div key={patient.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white"
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
                      {new Date(patient.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Operational Status" meta="Current clinic state">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Queue Pressure</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{waitingCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">patients waiting</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">In Consultation</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{activeCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">active rooms</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Checkout Review</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{completedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">completed visits</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
