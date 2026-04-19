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
      <div className="border-l border-border relative" style={{ minHeight: "28px" }}>
        <button
          className="absolute inset-0 m-0.5 rounded-md flex items-center px-2 overflow-hidden
            transition-opacity hover:opacity-80"
          style={{
            background:
              "repeating-linear-gradient(45deg,#fee2e2,#fee2e2 5px,#fecaca 5px,#fecaca 10px)",
            border: "1px solid #f87171",
          }}
          title={`Blocked: ${timeBlock.reason ?? "No reason"} — click to remove`}
          onClick={(e) => {
            e.stopPropagation()
            onClickTimeBlock(timeBlock)
          }}
        >
          <span className="text-[9px] font-semibold text-red-700 truncate select-none">
            🚫 {timeBlock.reason ?? "Blocked"}
          </span>
        </button>
      </div>
    )
  }

  if (appointment) {
    return (
      <div className="border-l border-border relative" style={{ minHeight: "28px" }}>
        <CalendarEvent appointment={appointment} onClick={onClickAppointment} />
      </div>
    )
  }

  return (
    <div
      className="border-l border-border relative group cursor-pointer"
      style={{ minHeight: "28px" }}
      onClick={() => onClickEmpty(date, time)}
    >
      <div
        className="absolute inset-0.5 rounded-md border-2 border-dashed border-transparent
          group-hover:border-border group-hover:bg-muted/30 transition-all flex items-center
          justify-center opacity-0 group-hover:opacity-100"
      >
        <Plus size={11} className="text-muted-foreground" />
      </div>
    </div>
  )
}
