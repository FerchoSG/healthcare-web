"use client"

import type { Appointment } from "@/types/api"

const APT_COLORS = [
  "#008BB0",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#DDA0DD",
  "#FF6B6B",
]

/** Deterministic color from appointment id so the same appointment always gets
 *  the same color regardless of list position. */
function getColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return APT_COLORS[Math.abs(h) % APT_COLORS.length]
}

interface CalendarEventProps {
  appointment: Appointment
  onClick: (appointment: Appointment) => void
}

export function CalendarEvent({ appointment, onClick }: CalendarEventProps) {
  const color = getColor(appointment.id)
  const patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`

  return (
    <button
      className="absolute inset-0.5 rounded-md px-2 py-1 text-white text-[10px] font-semibold
        leading-tight hover:opacity-90 active:opacity-80 transition-all shadow-sm text-left
        flex flex-col overflow-hidden"
      style={{ backgroundColor: color }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(appointment)
      }}
    >
      <p className="font-bold truncate leading-snug">{patientName}</p>
      <p className="opacity-80 truncate text-[9px]">
        {appointment.reason ?? appointment.service?.name ?? ""}
      </p>
    </button>
  )
}
