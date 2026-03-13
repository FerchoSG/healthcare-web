"use client"

import { useState } from "react"
import { APPOINTMENTS } from "@/lib/store"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DATES = [9, 10, 11, 12, 13, 14, 15]
const APT_COLORS = ["#008BB0", "#FF6B6B", "#008BB0", "#008BB0", "#DDA0DD", "#FFEAA7"]

interface CalendarViewProps {
  onNewAppointment: (slot: { date?: string; time?: string }) => void
}

export function CalendarView({ onNewAppointment }: CalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState("Mar 9 – 14, 2026")

  // Map day index to ISO date string for the current displayed week
  const DAY_DATES = ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14"]

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      <div className="bg-white rounded-lg shadow-md border border-border flex flex-col overflow-hidden" style={{ minHeight: "560px" }}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-foreground">Weekly Calendar</h3>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-md hidden sm:inline">{currentWeek}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek("Mar 2 – 7, 2026")}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button className="px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold">
              Today
            </button>
            <button
              onClick={() => setCurrentWeek("Mar 16 – 21, 2026")}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Mobile Agenda View ── */}
        <div className="flex flex-col gap-2 p-4 lg:hidden flex-1 overflow-y-auto">
          {DAYS.map((day, dayIdx) => {
            const dayApts = APPOINTMENTS.filter((a) => {
              const aptHour = parseInt(a.time.split(":")[0])
              return dayIdx === 3 || (dayIdx === 0 && aptHour === 9)
            })
            return (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span
                    className={`text-xs font-bold w-7 h-7 rounded-md flex items-center justify-center ${
                      DATES[dayIdx] === 12 ? "text-white" : "text-foreground bg-muted"
                    }`}
                    style={DATES[dayIdx] === 12 ? { backgroundColor: "var(--neon-green)" } : {}}
                  >
                    {DATES[dayIdx]}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{day}</span>
                </div>
                {dayApts.length > 0 ? (
                  dayApts.map((apt, i) => (
                    <div
                      key={apt.id + dayIdx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border mb-1.5"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: APT_COLORS[APPOINTMENTS.indexOf(apt) % APT_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{apt.patientName}</p>
                        <p className="text-[10px] text-muted-foreground">{apt.time} — {apt.reason}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <button
                    onClick={() => onNewAppointment({ date: DAY_DATES[dayIdx] })}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-muted-foreground hover:bg-muted/40 transition-all mb-1.5"
                  >
                    <Plus size={12} /> Add appointment
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Desktop Weekly Grid ── */}
        <div className="hidden lg:block">
        {/* Day headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "64px repeat(6, 1fr)" }}>
          <div className="py-3" />
          {DAYS.map((day, i) => (
            <div key={day} className="py-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{day}</p>
              <p
                className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-md flex items-center justify-center mx-auto ${
                  DATES[i] === 12 ? "text-white" : "text-foreground"
                }`}
                style={DATES[i] === 12 ? { backgroundColor: "var(--neon-green)" } : {}}
              >
                {DATES[i]}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid border-b border-border"
                style={{ gridTemplateColumns: "64px repeat(6, 1fr)", minHeight: "72px" }}
              >
                <div className="px-3 py-2">
                  <span className="text-[10px] text-muted-foreground">{hour}</span>
                </div>
                {DAYS.map((day, dayIdx) => {
                  const hourNum = parseInt(hour)
                  const apt = APPOINTMENTS.find((a) => {
                    const aptHour = parseInt(a.time.split(":")[0])
                    return aptHour === hourNum && (dayIdx === 3 || (dayIdx === 0 && aptHour === 9))
                  })
                  return (
                    <div
                      key={day}
                      className="border-l border-border p-1.5 relative group cursor-pointer"
                      onClick={() => {
                        if (!apt) {
                          onNewAppointment({ date: DAY_DATES[dayIdx], time: hour })
                        }
                      }}
                    >
                      {apt ? (
                        <div
                          className="rounded-lg p-2 text-white text-[10px] font-semibold leading-tight cursor-pointer hover:opacity-90 transition-all absolute inset-1"
                          style={{
                            backgroundColor: APT_COLORS[APPOINTMENTS.indexOf(apt) % APT_COLORS.length],
                            opacity: 0.92,
                          }}
                        >
                          <p className="font-bold truncate">{apt.patientName}</p>
                          <p className="opacity-80 truncate">{apt.reason}</p>
                        </div>
                      ) : (
                        // Empty slot hover indicator
                        <div className="absolute inset-1 rounded-lg border-2 border-dashed border-transparent group-hover:border-border group-hover:bg-muted/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Plus size={14} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        </div> {/* end hidden lg:block */}
      </div>

      {/* Upcoming appointments list */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-4">Upcoming Appointments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {APPOINTMENTS.map((apt, i) => (
            <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: APT_COLORS[i % APT_COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{apt.patientName}</p>
                <p className="text-[10px] text-muted-foreground">{apt.time} — {apt.reason}</p>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{apt.doctorName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
