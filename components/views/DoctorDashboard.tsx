"use client"

import { useState } from "react"
import { APPOINTMENTS, PATIENTS } from "@/lib/store"
import { Stethoscope, Clock, User, FileText } from "lucide-react"

interface DoctorDashboardProps {
  onOpenEMR: (patientId: string) => void
}

export function DoctorDashboard({ onOpenEMR }: DoctorDashboardProps) {
  const myAppointments = APPOINTMENTS.filter((a) => a.doctorName === "Dr. Carlos")
  // Track which appointment has an active consultation
  const [activeConsultId, setActiveConsultId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Greeting */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Thursday, March 12</p>
            <h2 className="text-2xl font-extrabold text-foreground text-balance">Good morning, Dr. Carlos.</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You have{" "}
              <span className="font-semibold" style={{ color: "var(--neon-green)" }}>
                {myAppointments.length} appointments
              </span>{" "}
              scheduled today.
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
          { label: "Today's Patients", value: String(myAppointments.length), icon: <User size={14} /> },
          { label: "In Progress", value: activeConsultId ? "1" : "0", icon: <Clock size={14} /> },
          { label: "Completed", value: String(myAppointments.filter((a) => a.status === "Completed").length), icon: <FileText size={14} /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
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

      {/* Appointment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {myAppointments.map((apt) => {
          const patient = PATIENTS.find((p) => p.id === apt.patientId)
          const isActive = activeConsultId === apt.id

          return (
            <div
              key={apt.id}
              className={`bg-white rounded-lg shadow-md p-5 border flex flex-col gap-3 transition-all ${
                isActive ? "border-[var(--neon-green)] shadow-sm" : "border-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: apt.avatarColor }}
                >
                  {apt.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{patient ? `Age ${patient.age}` : ""}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${
                    isActive
                      ? "text-white"
                      : apt.status === "Waiting"
                      ? "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                      : "text-muted-foreground bg-muted"
                  }`}
                  style={isActive ? { backgroundColor: "var(--neon-green)" } : {}}
                >
                  {isActive ? "Active" : apt.status}
                </span>
              </div>

              {/* Details */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {apt.time}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={11} />
                  {apt.reason}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-1">
                {isActive ? (
                  <>
                    <button
                      onClick={() => onOpenEMR(apt.patientId)}
                      className="flex-1 py-2.5 rounded-md text-xs font-semibold border-2 transition-all hover:bg-muted"
                      style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)" }}
                    >
                      Open EMR
                    </button>
                    <button
                      onClick={() => setActiveConsultId(null)}
                      className="flex-1 py-2.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all"
                    >
                      End Consultation
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveConsultId(apt.id)}
                    className="w-full py-2.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    Start Consultation
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
