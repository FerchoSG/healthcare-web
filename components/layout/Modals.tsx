"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  addMinutesToIso,
  clinicLocalDateTimeToIso,
  getClinicAgeFromBirthDate,
  getClinicTodayKey,
} from "@/lib/clinic-time"
import { emitDataChanged } from "@/lib/data-events"
import { createAppointment } from "@/services/appointments.service"
import { fetchDoctors } from "@/services/clinic-services.service"
import { createPatient, fetchPatients } from "@/services/patients.service"
import { Gender } from "@/types/api"
import type { DoctorSummary, Patient } from "@/types/api"

interface NewAppointmentDialogProps {
  open: boolean
  onClose: () => void
  preselectedSlot?: { date?: string; time?: string }
}

const EMPTY_PATIENT_FORM = {
  firstName: "",
  lastName: "",
  identification: "",
  whatsapp: "",
  birthDate: "",
  gender: Gender.F,
}

function patientName(patient: Patient) {
  return `${patient.first_name} ${patient.last_name}`
}

function patientAge(patient: Patient) {
  return getClinicAgeFromBirthDate(patient.birth_date)
}

function patientInitials(patient: Patient) {
  return `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase()
}

function avatarColor(_label: string) { return "var(--ds-action)" }

function toIsoDateTime(date: string, time: string) {
  return clinicLocalDateTimeToIso(date, time)
}

function plusMinutes(iso: string, minutes: number) {
  return addMinutesToIso(iso, minutes)
}

export function NewAppointmentDialog({
  open,
  onClose,
  preselectedSlot,
}: NewAppointmentDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<DoctorSummary[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState(preselectedSlot?.date || getClinicTodayKey())
  const [time, setTime] = useState(preselectedSlot?.time || "09:00")
  const [reason, setReason] = useState("")
  const [showCombo, setShowCombo] = useState(false)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingPatient, setCreatingPatient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = (nextDoctors: DoctorSummary[] = []) => {
    setPatients((prev) => prev)
    setPatientSearch("")
    setSelectedPatientId("")
    setReason("")
    setShowCombo(false)
    setShowNewPatientForm(false)
    setPatientForm(EMPTY_PATIENT_FORM)
    setError(null)
    setDate(preselectedSlot?.date || getClinicTodayKey())
    setTime(preselectedSlot?.time || "09:00")
    setDoctorId(nextDoctors[0]?.id || "")
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    resetForm()

    Promise.all([fetchPatients({ page: 1, limit: 100 }), fetchDoctors()])
      .then(([patientsRes, doctorsRes]) => {
        if (cancelled) return
        setPatients(patientsRes.data)
        setDoctors(doctorsRes)
        resetForm(doctorsRes)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar la agenda")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, preselectedSlot])

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase()
    if (!term) return patients.slice(0, 8)
    return patients.filter((patient) =>
      patientName(patient).toLowerCase().includes(term) ||
      patient.identification.toLowerCase().includes(term),
    )
  }, [patientSearch, patients])

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null

  const handleSave = async () => {
    const missing: string[] = []
    if (!selectedPatientId) missing.push("paciente")
    if (!doctorId) missing.push("doctor")
    if (!date) missing.push("fecha")
    if (!time) missing.push("hora")

    if (missing.length > 0) {
      setError(`Falta ${missing.join(", ")}`)
      return
    }

    const startTime = toIsoDateTime(date, time)
    const endTime = plusMinutes(startTime, 30)

    try {
      setSaving(true)
      setError(null)
      await createAppointment({
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        start_time: startTime,
        end_time: endTime,
        reason: reason || undefined,
      })
      emitDataChanged({ entity: "appointment", action: "created" })
      resetForm(doctors)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cita")
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePatientAndSelect = async () => {
    if (!patientForm.firstName || !patientForm.lastName || !patientForm.identification || !patientForm.birthDate) {
      setError("Completa nombre, apellido, identificación y fecha de nacimiento del paciente")
      return
    }

    try {
      setCreatingPatient(true)
      setError(null)
      const created = await createPatient({
        first_name: patientForm.firstName,
        last_name: patientForm.lastName,
        identification: patientForm.identification,
        birth_date: patientForm.birthDate,
        gender: patientForm.gender,
        whatsapp_phone: patientForm.whatsapp || undefined,
      })
      emitDataChanged({ entity: "patient", action: "created" })
      setPatients((prev) => [created, ...prev])
      setSelectedPatientId(created.id)
      setPatientSearch("")
      setShowCombo(false)
      setShowNewPatientForm(false)
      setPatientForm(EMPTY_PATIENT_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el paciente")
    } finally {
      setCreatingPatient(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="rounded-lg w-[95vw] max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">Nueva cita</DialogTitle>
          <DialogDescription className="sr-only">
            Agenda una nueva cita con datos reales de pacientes y doctores.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <div className="flex flex-col gap-1.5 relative">
            <label htmlFor="modals-field-1" className="text-xs font-semibold text-foreground">Paciente</label>
            <input id="modals-field-1"
              type="text"
              placeholder={loading ? "Cargando pacientes..." : "Buscar por nombre o cédula"}
              value={selectedPatient ? patientName(selectedPatient) : patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                setSelectedPatientId("")
                setShowCombo(Boolean(e.target.value.trim()))
                if (showNewPatientForm) setShowNewPatientForm(false)
              }}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {selectedPatient ? `Seleccionado: ${patientName(selectedPatient)}` : "Puedes usar un paciente existente o crear uno nuevo."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowNewPatientForm((current) => !current)
                  setShowCombo(false)
                }}
                className="text-xs font-semibold text-foreground underline underline-offset-2"
              >
                {showNewPatientForm ? "Ocultar formulario" : "Nuevo paciente"}
              </button>
            </div>
            {showCombo && !selectedPatient && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-md overflow-hidden  max-h-64 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-4 py-3">No se encontraron pacientes</p>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-all"
                      onMouseDown={() => {
                        setSelectedPatientId(patient.id)
                        setPatientSearch("")
                        setShowCombo(false)
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-primary-foreground text-xs font-semibold"
                        style={{ backgroundColor: avatarColor(patientName(patient)) }}
                      >
                        {patientInitials(patient)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{patientName(patient)}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.identification} · {patientAge(patient)} años
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {showNewPatientForm && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-foreground">Crear paciente para esta cita</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={patientForm.firstName}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={patientForm.lastName}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Identificación"
                  value={patientForm.identification}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, identification: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp"
                  value={patientForm.whatsapp}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={patientForm.birthDate}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                />
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, gender: e.target.value as Gender }))}
                  className="w-full px-3 py-2 rounded-md bg-card text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleCreatePatientAndSelect}
                disabled={creatingPatient}
                className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creatingPatient ? "Creando paciente..." : "Crear y seleccionar paciente"}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modals-field-2" className="text-xs font-semibold text-foreground">Doctor</label>
            <select id="modals-field-2"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            >
              <option value="">Selecciona un doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-3" className="text-xs font-semibold text-foreground">Fecha</label>
              <input id="modals-field-3"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-4" className="text-xs font-semibold text-foreground">Hora</label>
              <select id="modals-field-4"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              >
                {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00"].map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modals-field-5" className="text-xs font-semibold text-foreground">Motivo</label>
            <textarea id="modals-field-5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe el motivo de la cita"
              rows={3}
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <button
            type="button"
            onClick={() => {
              resetForm(doctors)
              onClose()
            }}
            className="flex-1 py-2.5 rounded-md bg-muted  text-muted-foreground text-sm font-semibold hover:text-foreground transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-2.5 rounded-md bg-primary  text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cita"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
    birthDate: "",
    gender: Gender.F,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const reset = () => {
    setForm({
      firstName: "",
      lastName: "",
      identification: "",
      whatsapp: "",
      birthDate: "",
      gender: Gender.F,
    })
    setError(null)
  }

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.identification || !form.birthDate) {
      setError("Completa nombre, cédula y fecha de nacimiento")
      return
    }

    try {
      setSaving(true)
      setError(null)
      await createPatient({
        first_name: form.firstName,
        last_name: form.lastName,
        identification: form.identification,
        birth_date: form.birthDate,
        gender: form.gender,
        whatsapp_phone: form.whatsapp || undefined,
      })
      emitDataChanged({ entity: "patient", action: "created" })
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el paciente")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] sm:rounded-l-3xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">Registro rápido</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Crea un paciente real en la clínica actual.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-6" className="text-xs font-semibold text-foreground">Nombre</label>
              <input id="modals-field-6"
                type="text"
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="María"
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-7" className="text-xs font-semibold text-foreground">Apellido</label>
              <input id="modals-field-7"
                type="text"
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="Gonzalez"
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modals-field-8" className="text-xs font-semibold text-foreground">Cédula</label>
            <input id="modals-field-8"
              type="text"
              value={form.identification}
              onChange={set("identification")}
              placeholder="1-0000-0000"
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-9" className="text-xs font-semibold text-foreground">Nacimiento</label>
              <input id="modals-field-9"
                type="date"
                value={form.birthDate}
                onChange={set("birthDate")}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modals-field-10" className="text-xs font-semibold text-foreground">Género</label>
              <select id="modals-field-10"
                value={form.gender}
                onChange={set("gender")}
                className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              >
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modals-field-11" className="text-xs font-semibold text-foreground">WhatsApp</label>
            <input id="modals-field-11"
              type="tel"
              value={form.whatsapp}
              onChange={set("whatsapp")}
              placeholder="+506 8888-8888"
              className="w-full px-4 py-2.5 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-border">
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
            }}
            className="flex-1 py-2.5 rounded-md bg-muted  text-muted-foreground text-sm font-semibold hover:text-foreground transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-md bg-primary  text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Registrar paciente"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
