"use client"

import { useState, useEffect, useCallback } from "react"
import { LINE_CHART_DATA, PATIENTS } from "@/lib/store"
import { AppointmentStatus, type Appointment } from "@/types/api"
import { fetchTodayAppointments } from "@/services/appointments.service"
import {
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  CalendarCheck,
  Loader2,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

function NeonBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
      style={{ backgroundColor: "var(--neon-green-bg)", color: "var(--neon-green-text)" }}
    >
      <ArrowUpRight size={11} />
      {label}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-card-foreground border border-border rounded-lg px-3 py-2 text-xs font-semibold shadow-lg">
        <p className="text-muted-foreground">{label}</p>
        <p>${(payload[0].value / 1000).toFixed(0)}k revenue</p>
      </div>
    )
  }
  return null
}

const statusBadge: Record<AppointmentStatus, { label: string; cls: string }> = {
  [AppointmentStatus.PENDING]: { label: "Pending", cls: "text-muted-foreground bg-muted" },
  [AppointmentStatus.CONFIRMED]: { label: "Confirmed", cls: "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
  [AppointmentStatus.WAITING]: { label: "Waiting", cls: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400" },
  [AppointmentStatus.IN_CONSULTATION]: { label: "Active", cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
  [AppointmentStatus.COMPLETED]: { label: "Done", cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
  [AppointmentStatus.CANCELLED]: { label: "Cancelled", cls: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400" },
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

interface AdminDashboardProps {
  onViewPatients: () => void
}

export function AdminDashboard({ onViewPatients }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppts, setLoadingAppts] = useState(true)

  const loadAppointments = useCallback(async () => {
    try {
      setLoadingAppts(true)
      const data = await fetchTodayAppointments()
      setAppointments(data)
    } catch {
      // Silently fail in the sidebar schedule — the receptionist dashboard is the primary view
    } finally {
      setLoadingAppts(false)
    }
  }, [])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  const totalRevenue = 102000

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Patients KPI */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
            <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
              <Users size={13} />
            </div>
            Patients
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-foreground tracking-tight">1,293</span>
            <div className="mb-1">
              <NeonBadge label="+36.8%" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">vs last month</p>
        </div>

        {/* Revenue KPI */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
            <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
              <DollarSign size={13} />
            </div>
            Balance
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-foreground tracking-tight">256k</span>
            <div className="mb-1">
              <NeonBadge label="+12.4%" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">total revenue</p>
        </div>
      </div>

      {/* Row 2: New patients banner */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-foreground">857 new customers today!</p>
            <p className="text-xs text-muted-foreground">Send a welcome message to all new customers</p>
          </div>
          <button
            onClick={onViewPatients}
            className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
            View all
          </button>
        </div>
        <div className="flex items-center gap-2.5 mt-2">
          {PATIENTS.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 border-2 border-card"
              style={{ backgroundColor: p.avatarColor }}
              title={p.name}
            >
              {p.avatarInitials}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            +852
          </div>
        </div>
      </div>

      {/* Row 3: Chart + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-5 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Revenue Overview</h3>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-md">Last 7 Mos.</span>
          </div>

          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LINE_CHART_DATA} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "inherit" }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--neon-green)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--neon-green)", stroke: "white", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-extrabold text-foreground">$10.2m</span>
            <NeonBadge label="+36.8%" />
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-5 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Schedule</h3>
            <CalendarCheck size={15} className="text-muted-foreground" />
          </div>

          {loadingAppts ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No appointments today</p>
          ) : (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {appointments.map((apt) => {
                const name = `${apt.patient.first_name} ${apt.patient.last_name}`
                const initials = getInitials(apt.patient.first_name, apt.patient.last_name)
                const color = getAvatarColor(name)
                const badge = statusBadge[apt.status] ?? statusBadge[AppointmentStatus.PENDING]

                return (
                  <div key={apt.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(apt.start_time)} — {apt.reason ?? apt.service?.name ?? "Appointment"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Appointments Today", value: String(appointments.length), icon: <CalendarCheck size={14} />, badge: `${appointments.length}` },
          { label: "Revenue This Month", value: "$24,890", icon: <TrendingUp size={14} />, badge: "+18.2%" },
          { label: "New Patients", value: "47", icon: <Users size={14} />, badge: "+8" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              {stat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-extrabold text-foreground">{stat.value}</span>
                <NeonBadge label={stat.badge} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
