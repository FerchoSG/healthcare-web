"use client"

import type { Appointment } from "@/types/api"

const APT_COLORS = [
  "#143C92",
  "#2D7DD2",
  "#4BADEA",
  "#18A058",
  "#7C3AED",
  "#FF766D",
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
      className="absolute inset-0.5 rounded-[10px] px-2 py-1 text-white text-[10px] font-semibold
        leading-tight hover:opacity-90 active:opacity-80 transition-all shadow-md text-left
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
