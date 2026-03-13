"use client"

import { PATIENTS } from "@/lib/store"
import { Phone, Calendar, MoreHorizontal } from "lucide-react"

interface PatientsViewProps {
  onOpenEMR?: (patientId: string) => void
}

export function PatientsView({ onOpenEMR }: PatientsViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Patients", value: "1,293" },
          { label: "Active This Month", value: "857" },
          { label: "New This Week", value: "47" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-md p-4 border border-border">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PATIENTS.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow-md p-5 border border-border flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: patient.avatarColor }}
                >
                  {patient.avatarInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">Age {patient.age}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${
                  patient.status === "Active"
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                    : patient.status === "Pending"
                    ? "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                    : "text-muted-foreground bg-muted"
                }`}
              >
                {patient.status}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={11} />
                {patient.phone}
              </div>
              {patient.nextAppointment && (
                <div className="flex items-center gap-2">
                  <Calendar size={11} />
                  {patient.nextAppointment}
                </div>
              )}
              {patient.reason && (
                <p className="text-[11px] bg-muted rounded-md px-2.5 py-1 w-fit">{patient.reason}</p>
              )}
            </div>

            <div className="flex gap-2 mt-1">
              {onOpenEMR && (
                <button
                  onClick={() => onOpenEMR(patient.id)}
                  className="flex-1 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                >
                  Open Record
                </button>
              )}
              <button className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
