"use client"

import { Plus } from "lucide-react"
import type { Appointment, TimeBlock } from "@/types/api"
import { CalendarEvent } from "./CalendarEvent"

interface CalendarCellProps {
  date: string
  time: string
  appointments?: Appointment[]
  timeBlock?: TimeBlock
  onClickEmpty: (date: string, time: string) => void
  onClickAppointment: (appointment: Appointment) => void
  onClickTimeBlock: (block: TimeBlock) => void
}

export function CalendarCell({
  date, time, appointments = [], timeBlock,
  onClickEmpty, onClickAppointment, onClickTimeBlock,
}: CalendarCellProps) {
  return (
    <div className="relative min-h-14 border-l border-border">
      {appointments.length ? (
        <div className="flex flex-col gap-1 p-0.5">
          {appointments.map(appointment => (
            <CalendarEvent key={appointment.id} appointment={appointment} onClick={onClickAppointment} />
          ))}
        </div>
      ) : timeBlock ? (
        <button
          type="button"
          onClick={() => onClickTimeBlock(timeBlock)}
          title={`Horario bloqueado: ${timeBlock.reason ?? "Sin motivo"}`}
          className="absolute inset-0.5 flex items-center overflow-hidden rounded-md border border-border bg-neutral-bg px-2 text-left text-xs text-neutral"
        >
          <span className="truncate">{timeBlock.reason ?? "No disponible"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onClickEmpty(date, time)}
          aria-label={`Crear cita el ${date} a las ${time}`}
          className="group absolute inset-0 flex items-center justify-center hover:bg-accent"
        >
          <Plus size={14} className="text-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </button>
      )}
    </div>
  )
}
