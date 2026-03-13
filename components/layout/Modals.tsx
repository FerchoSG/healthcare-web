"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PATIENTS } from "@/lib/store"

// ─── New Appointment Dialog ────────────────────────────────────────────────
interface NewAppointmentDialogProps {
  open: boolean
  onClose: () => void
  preselectedSlot?: { date?: string; time?: string }
}

export function NewAppointmentDialog({ open, onClose, preselectedSlot }: NewAppointmentDialogProps) {
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [doctor, setDoctor] = useState("Dr. Carlos")
  const [date, setDate] = useState(preselectedSlot?.date || "2026-03-12")
  const [time, setTime] = useState(preselectedSlot?.time || "09:00")
  const [reason, setReason] = useState("")
  const [showCombo, setShowCombo] = useState(false)

  const filtered = PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const handleSave = () => {
    onClose()
    setPatientSearch("")
    setSelectedPatient("")
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-lg w-[95vw] max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">New Appointment</DialogTitle>
          <DialogDescription className="sr-only">Schedule a new appointment by selecting a patient, doctor, date, time, and reason.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* Patient Search (Combobox) */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-foreground">Patient</label>
            <input
              type="text"
              placeholder="Search patient..."
              value={selectedPatient || patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                setSelectedPatient("")
                setShowCombo(true)
              }}
              onFocus={() => setShowCombo(true)}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            {showCombo && patientSearch && !selectedPatient && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-border rounded-md overflow-hidden shadow-xl">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-4 py-3">No patients found</p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-all"
                      onMouseDown={() => {
                        setSelectedPatient(p.name)
                        setPatientSearch("")
                        setShowCombo(false)
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.avatarInitials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">Age {p.age}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Doctor</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            >
              <option>Dr. Carlos</option>
              <option>Dr. Martinez</option>
              <option>Dr. Rodriguez</option>
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              >
                {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Reason / Chief Complaint</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for the appointment..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md bg-muted shadow-sm text-muted-foreground text-sm font-semibold hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-md bg-foreground shadow-sm text-background text-sm font-semibold hover:opacity-90 transition-all"
          >
            Save Appointment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Walk-in Sheet ─────────────────────────────────────────────────────────
interface WalkInSheetProps {
  open: boolean
  onClose: () => void
}

export function WalkInSheet({ open, onClose }: WalkInSheetProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    identification: "",
    whatsapp: "",
    reason: "",
    triage: "Low",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    onClose()
    setForm({ firstName: "", lastName: "", identification: "", whatsapp: "", reason: "", triage: "Low" })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] sm:rounded-l-3xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-bold">Quick Register — Walk-in Patient</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">Fill in the patient's basic information to register them immediately.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="María"
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="González"
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Identification (Cédula)</label>
            <input
              type="text"
              value={form.identification}
              onChange={set("identification")}
              placeholder="1-0000-0000"
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">WhatsApp Phone</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={set("whatsapp")}
              placeholder="+506 8888-8888"
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Triage / Priority</label>
            <select
              value={form.triage}
              onChange={set("triage")}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            >
              <option value="Low">Low — Routine</option>
              <option value="Medium">Medium — Urgent</option>
              <option value="High">High — Emergency</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Immediate Reason</label>
            <textarea
              value={form.reason}
              onChange={set("reason")}
              placeholder="Describe the reason for the walk-in visit..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md bg-muted shadow-sm text-muted-foreground text-sm font-semibold hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-md bg-foreground shadow-sm text-background text-sm font-semibold hover:opacity-90 transition-all"
          >
            Register Patient
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── New Invoice Dialog ────────────────────────────────────────────────────
interface NewInvoiceDialogProps {
  open: boolean
  onClose: () => void
}

export function NewInvoiceDialog({ open, onClose }: NewInvoiceDialogProps) {
  const [patient, setPatient] = useState("")
  const [service, setService] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("2026-03-12")

  const handleSave = () => {
    onClose()
    setPatient("")
    setService("")
    setAmount("")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-lg w-[95vw] max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">Create Invoice</DialogTitle>
          <DialogDescription className="sr-only">Create a new invoice by selecting a patient, service, amount, and date.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Patient</label>
            <select
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            >
              <option value="">Select patient...</option>
              {PATIENTS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Service / Procedure</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. Root Canal Treatment"
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md bg-muted shadow-sm text-muted-foreground text-sm font-semibold hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-md bg-foreground shadow-sm text-background text-sm font-semibold hover:opacity-90 transition-all"
          >
            Create Invoice
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
