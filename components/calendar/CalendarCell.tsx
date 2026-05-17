"use client"

import { Plus } from "lucide-react"
import type { Appointment, TimeBlock } from "@/types/api"
import { CalendarEvent } from "./CalendarEvent"

interface CalendarCellProps {
  date: string
  time: string
  appointment?: Appointment
  timeBlock?: TimeBlock
  onClickEmpty: (date: string, time: string) => void
  onClickAppointment: (appointment: Appointment) => void
  onClickTimeBlock: (block: TimeBlock) => void
}

export function CalendarCell({
  date,
  time,
  appointment,
  timeBlock,
  onClickEmpty,
  onClickAppointment,
  onClickTimeBlock,
}: CalendarCellProps) {
  if (timeBlock) {
    return (
      <div className="relative border-l border-border" style={{ minHeight: "28px" }}>
        <button
          type="button"
          className="absolute inset-0 m-0.5 flex items-center overflow-hidden rounded-md px-2 transition-opacity hover:opacity-80"
          style={{
            background:
              "repeating-linear-gradient(45deg,#fee2e2,#fee2e2 5px,#fecaca 5px,#fecaca 10px)",
            border: "1px solid #f87171",
          }}
          title={`Bloqueado: ${timeBlock.reason ?? "Sin motivo"} - clic para eliminar`}
          onClick={(e) => {
            e.stopPropagation()
            onClickTimeBlock(timeBlock)
          }}
        >
          <span className="truncate select-none text-[9px] font-semibold text-red-700">
            Bloqueado: {timeBlock.reason ?? "Sin motivo"}
          </span>
        </button>
      </div>
    )
  }

  if (appointment) {
    return (
      <div className="relative border-l border-border" style={{ minHeight: "28px" }}>
        <CalendarEvent appointment={appointment} onClick={onClickAppointment} />
      </div>
    )
  }

  return (
    <div
      className="group relative cursor-pointer border-l border-border"
      style={{ minHeight: "28px" }}
      onClick={() => onClickEmpty(date, time)}
    >
      <div
        className="absolute inset-0.5 flex items-center justify-center rounded-md border-2 border-dashed border-transparent opacity-0 transition-all group-hover:border-border group-hover:bg-muted/30 group-hover:opacity-100"
      >
        <Plus size={11} className="text-muted-foreground" />
      </div>
    </div>
  )
}
