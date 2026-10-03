"use client"

import type { Appointment } from "@/types/api"
import { formatClinicTime } from "@/lib/clinic-time"
import { appointmentStatusClass, appointmentStatusColor, appointmentStatusLabel } from "@/lib/design"

interface CalendarEventProps {
  appointment: Appointment
  onClick: (appointment: Appointment) => void
}

export function CalendarEvent({ appointment, onClick }: CalendarEventProps) {
  const name = `${appointment.patient.first_name} ${appointment.patient.last_name}`
  const label = appointmentStatusLabel(appointment.status)
  const service = appointment.service?.name ?? appointment.reason ?? ""
  const doctor = `${appointment.doctor.first_name} ${appointment.doctor.last_name}`

  return (
    <button
      onClick={event => { event.stopPropagation(); onClick(appointment) }}
      title={`${name} · ${label} · ${service} · ${doctor}`}
      className={`flex min-h-14 w-full flex-col justify-center overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs ${appointmentStatusClass(appointment.status)}`}
      style={{ borderLeftColor: appointmentStatusColor(appointment.status) }}
    >
      <span className="truncate font-semibold">{formatClinicTime(appointment.start_time)} · {name}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
