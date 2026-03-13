"use client"

import { useState } from "react"
import { APPOINTMENTS, PATIENTS, type Appointment } from "@/lib/store"
import { UserPlus, CalendarPlus, Clock, CheckCircle, DollarSign } from "lucide-react"

const STATUS_OPTIONS = ["Pending", "Waiting", "In Consultation", "Completed"] as const

const statusColors: Record<string, string> = {
  "Pending": "text-muted-foreground bg-muted",
  "Waiting": "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
  "In Consultation": "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  "Completed": "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
}

interface ReceptionistDashboardProps {
  onNewAppointment: () => void
  onWalkIn: () => void
  onOpenEMR: (patientId: string) => void
}

export function ReceptionistDashboard({ onNewAppointment, onWalkIn, onOpenEMR }: ReceptionistDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS)

  const updateStatus = (id: string, status: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Appointment["status"] } : a))
    )
  }

  const pending = appointments.filter((a) => a.status !== "Completed")
  const completed = appointments.filter((a) => a.status === "Completed")

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Top strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Waiting</p>
            <p className="text-xl font-extrabold text-foreground">
              {appointments.filter((a) => a.status === "Waiting").length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--neon-green-bg)" }}>
            <CheckCircle size={16} style={{ color: "var(--neon-green)" }} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Completed</p>
            <p className="text-xl font-extrabold text-foreground">{completed.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
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
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-5 border border-border flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-4">Today's Queue</h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 cursor-pointer hover:opacity-80 transition-all"
                  style={{ backgroundColor: apt.avatarColor }}
                  onClick={() => onOpenEMR(apt.patientId)}
                  title="Open medical record"
                >
                  {apt.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{apt.time} — {apt.reason}</p>
                </div>
                <select
                  value={apt.status}
                  onChange={(e) => updateStatus(apt.id, e.target.value)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-md border-0 outline-none cursor-pointer focus:ring-2 focus:ring-ring/40 transition-all ${statusColors[apt.status] || "text-muted-foreground bg-muted"}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Actions + Pending Checkouts */}
        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-5 border border-border">
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
          <div className="bg-white rounded-lg shadow-md p-5 border border-border flex-1">
            <h3 className="text-sm font-bold text-foreground mb-3">Pending Checkouts</h3>
            {completed.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No pending checkouts</p>
            ) : (
              <div className="flex flex-col gap-2">
                {completed.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{apt.patientName}</p>
                      <p className="text-[10px] text-muted-foreground">{apt.reason}</p>
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
