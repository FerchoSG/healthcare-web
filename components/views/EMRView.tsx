"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, FileText, Pill, Plus, Trash2, Upload, X } from "lucide-react"
import {
  formatClinicDateTime,
  formatClinicDateFromKey,
  getClinicAgeFromBirthDate,
  getClinicNowDate,
} from "@/lib/clinic-time"
import { emitDataChanged } from "@/lib/data-events"
import { fetchCurrentClinic } from "@/services/clinics.service"
import { fetchMe, updateAppointmentStatus } from "@/services/appointments.service"
import {
  createMedicalRecord,
  downloadMedicalRecordPdf,
  fetchMedicalRecords,
} from "@/services/medical-records.service"
import { uploadClinicalFiles } from "@/services/storage.service"
import { fetchPatient } from "@/services/patients.service"
import { AppointmentStatus, type MedicalRecord, type Patient } from "@/types/api"
import type { Medication, ToothCondition } from "@/lib/store"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface EMRViewProps {
  patientId: string
  onClose: () => void
  initialConsultationActive?: boolean
  appointmentId?: string | null
}

type ClinicalTab = "notes" | "odontogram" | "gynae" | "prescriptions"

type DisplayPatient = {
  id: string
  name: string
  age: number | null
  phone: string | null
  avatarInitials: string
  avatarColor: string
  reason: string | null
}

const conditionColors: Record<ToothCondition, string> = {
  healthy: "var(--muted)",
  caries: "var(--ds-danger)",
  filling: "var(--ds-warning)",
  crown: "var(--ds-info)",
  missing: "var(--ds-neutral)",
  extraction: "var(--ds-action)",
}

const conditionLabels: Record<ToothCondition, string> = {
  healthy: "Sano",
  caries: "Caries",
  filling: "Obturación",
  crown: "Corona",
  missing: "Ausente",
  extraction: "Extracción",
}

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

function avatarColor(_label: string) { return "var(--ds-action)" }

function buildPatient(patient: Patient | null, records: MedicalRecord[]): DisplayPatient {
  if (!patient) {
    return {
      id: "",
      name: "Paciente",
      age: null,
      phone: null,
      avatarInitials: "P",
      avatarColor: "var(--ds-action)",
      reason: records[0]?.diagnosis ?? null,
    }
  }

  const name = `${patient.first_name} ${patient.last_name}`

  return {
    id: patient.id,
    name,
    age: getClinicAgeFromBirthDate(patient.birth_date),
    phone: patient.whatsapp_phone ?? null,
    avatarInitials: `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase(),
    avatarColor: avatarColor(name),
    reason: records[0]?.diagnosis ?? null,
  }
}

function ToothSVG({
  number,
  condition,
  onClick,
  isUpper,
  isSelected,
}: {
  number: number
  condition: ToothCondition
  onClick: () => void
  isUpper: boolean
  isSelected: boolean
}) {
  const color = conditionColors[condition]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1 transition-all group ${
        isSelected ? "bg-info-bg ring-2 ring-info" : "hover:bg-muted/40"
      }`}
      title={`Pieza ${number}: ${conditionLabels[condition]}`} aria-label={`Pieza ${number}: ${conditionLabels[condition]}`} aria-pressed={isSelected}
    >
      {isUpper && <span className="text-xs font-medium text-muted-foreground">{number}</span>}
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="transition-transform group-hover:scale-110">
        <path
          d={
            isUpper
              ? "M10 20 Q8 30 7 35 M14 22 Q14 32 14 36 M18 20 Q20 30 21 35"
              : "M10 16 Q8 6 7 1 M14 14 Q14 4 14 0 M18 16 Q20 6 21 1"
          }
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <rect
          x="4"
          y={isUpper ? "4" : "18"}
          width="20"
          height="18"
          rx="6"
          fill={color}
          stroke={condition === "healthy" ? "var(--ds-control-border)" : color}
          strokeWidth={isSelected ? "2" : "1.5"}
          className="transition-all"
        />
        {condition === "healthy" && (
          <>
            <path d="M14 7 L14 19" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <path d="M8 12 L20 12" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
          </>
        )}
      </svg>
      {!isUpper && <span className="text-xs font-medium text-muted-foreground">{number}</span>}
    </button>
  )
}

export function EMRView({ patientId, onClose, initialConsultationActive = false, appointmentId = null }: EMRViewProps) {
  const [apiPatient, setApiPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [specialtyModules, setSpecialtyModules] = useState<string[]>(["GENERAL_MEDICINE", "PRESCRIPTIONS"])
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClinicalTab>("notes")
  const [isConsultationActive, setIsConsultationActive] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [toothConditions, setToothConditions] = useState<Record<number, ToothCondition>>({})
  const [lmp, setLmp] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploads, setUploads] = useState<string[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [prescriptionNotes, setPrescriptionNotes] = useState("")
  const [newMed, setNewMed] = useState<Omit<Medication, "id">>({ name: "", dosage: "", frequency: "" })

  useEffect(() => {
    setIsConsultationActive(initialConsultationActive && canEdit)
  }, [initialConsultationActive, patientId, canEdit])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [patientRes, recordsRes, me, clinic] = await Promise.all([
          fetchPatient(patientId),
          fetchMedicalRecords(patientId),
          fetchMe(),
          fetchCurrentClinic(),
        ])
        if (cancelled) return

        setApiPatient(patientRes)
        setRecords(recordsRes)
        setDoctorId(me.id)
        setCanEdit(me.active_membership?.role === "DOCTOR")
        setSpecialtyModules(
          clinic.specialty_modules?.length ? clinic.specialty_modules : ["GENERAL_MEDICINE", "PRESCRIPTIONS"],
        )
        const latestRecord = recordsRes[0]
        setSelectedRecordId(latestRecord?.id ?? null)
        setDirty(false)
        const latestPrescription = latestRecord?.prescriptions?.[0]
        setDiagnosis(latestRecord?.diagnosis ?? "")
        setTreatment(latestRecord?.treatment_plan ?? "")
        setLmp(latestRecord?.gynoRecord?.last_menstrual_period?.slice(0, 10) ?? "")
        setUploads(latestRecord?.gynoRecord?.image_url ? [latestRecord.gynoRecord.image_url] : [])
        setPrescriptionNotes(latestPrescription?.additional_notes ?? "")
        setMedications(
          Array.isArray(latestPrescription?.medications)
            ? latestPrescription.medications.map((medication, index) => ({
                id: `med-${index}-${medication.name}`,
                name: medication.name,
                dosage: medication.dosage,
                frequency: medication.frequency,
              }))
            : [],
        )
        setToothConditions(
          (latestRecord?.dentalRecords ?? []).reduce<Record<number, ToothCondition>>((acc, dentalRecord) => {
            if (dentalRecord.condition) {
              acc[dentalRecord.tooth_number] = dentalRecord.condition as ToothCondition
            }
            return acc
          }, {}),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el expediente")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [patientId])

  const patient = useMemo(() => buildPatient(apiPatient, records), [apiPatient, records])
  const selectedToothCondition = selectedTooth ? toothConditions[selectedTooth] || "healthy" : null

  const savedGynoRecord = records.find(record => record.id === selectedRecordId)?.gynoRecord
  const gestWeeks = !isConsultationActive ? savedGynoRecord?.gestational_weeks ?? null : lmp
    ? Math.floor((getClinicNowDate().getTime() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null

  const edd = !isConsultationActive
    ? savedGynoRecord?.estimated_due_date ? formatClinicDateTime(savedGynoRecord.estimated_due_date, { dateStyle: "long" }) : null
    : lmp
    ? formatClinicDateTime(
        new Date(new Date(lmp).getTime() + 280 * 24 * 60 * 60 * 1000).toISOString(),
        { month: "long", day: "numeric", year: "numeric" },
      )
    : null

  const tabs: Array<{ key: ClinicalTab; label: string; icon: ReactNode }> = [
    { key: "notes", label: "Notas clínicas", icon: <FileText size={13} /> },
    ...(specialtyModules.includes("DENTAL")
      ? [{ key: "odontogram" as ClinicalTab, label: "Odontograma", icon: <Activity size={13} /> }]
      : []),
    ...(specialtyModules.includes("GYNECOLOGY")
      ? [{ key: "gynae" as ClinicalTab, label: "Ginecología", icon: <Activity size={13} /> }]
      : []),
    ...(specialtyModules.includes("PRESCRIPTIONS")
      ? [{ key: "prescriptions" as ClinicalTab, label: "Recetas", icon: <Pill size={13} /> }]
      : []),
  ]

  const saveClinicalNotes = async () => {
    if (newMed.name || newMed.dosage || newMed.frequency) { setError("Agrega el medicamento a la receta o limpia sus campos antes de guardar."); return }
    if (!doctorId) {
      setError("Se requiere el usuario autenticado para guardar")
      return
    }
    const dentalRecords = Object.entries(toothConditions)
      .filter(([, condition]) => condition !== "healthy")
      .map(([tooth, condition]) => ({
        tooth_number: Number(tooth),
        condition,
      }))

    const hasClinicalContent =
      Boolean(diagnosis) ||
      Boolean(treatment) ||
      medications.length > 0 ||
      dentalRecords.length > 0 ||
      Boolean(lmp) ||
      uploads.length > 0 ||
      Boolean(prescriptionNotes)

    if (!hasClinicalContent) {
      setError("Agrega información clínica antes de guardar el expediente")
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSaveMessage(null)

      const created = await createMedicalRecord({
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis: diagnosis || undefined,
        treatment_plan: treatment || undefined,
        gynoRecord:
          lmp || uploads[0]
            ? {
                last_menstrual_period: lmp || undefined,
                image_url: uploads[0] || undefined,
              }
            : undefined,
        dentalRecords: dentalRecords.length ? dentalRecords : undefined,
        prescription:
          medications.length > 0 || prescriptionNotes
            ? {
                medications: medications.map(({ name, dosage, frequency }) => ({
                  name,
                  dosage,
                  frequency,
                })),
                additional_notes: prescriptionNotes || undefined,
              }
            : undefined,
      })
      setRecords((prev) => [created, ...prev])
      setSelectedRecordId(created.id)
      setDirty(false)
      setSaveMessage("Expediente clínico guardado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el expediente clínico")
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    const latestRecord = records.find(record => record.id === selectedRecordId) ?? records[0]
    if (!latestRecord) {
      setError("Todavía no hay expediente guardado para generar el PDF")
      return
    }

    try {
      setDownloadingPdf(true)
      setError(null)
      const blob = await downloadMedicalRecordPdf(latestRecord.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `expediente-${patient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el PDF")
    } finally {
      setDownloadingPdf(false)
    }
  }

  const setCondition = (tooth: number, condition: ToothCondition) => {
    if (!isConsultationActive) return
    setDirty(true)
    setToothConditions((prev) => ({ ...prev, [tooth]: condition }))
    setSelectedTooth(tooth)
  }

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage || !newMed.frequency) return
    setDirty(true)
    setMedications((prev) => [...prev, { ...newMed, id: `med-${Date.now()}` }])
    setNewMed({ name: "", dosage: "", frequency: "" })
  }

  const removeMedication = (id: string) => {
    setDirty(true)
    setMedications((prev) => prev.filter((medication) => medication.id !== id))
  }

  const handleClinicalUploads = async (files: File[]) => {
    if (!isConsultationActive || files.length === 0) return

    try {
      setUploadingFiles(true)
      setError(null)
      const uploaded = await uploadClinicalFiles(files)
      setDirty(true)
      setUploads((prev) => [...prev, ...uploaded.map((file) => file.key)])
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir los archivos clínicos")
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleFinishConsultation = async () => {
    if (dirty || newMed.name || newMed.dosage || newMed.frequency) { setError("Guarda los cambios del expediente antes de finalizar la consulta."); return }
    if (!appointmentId) {
      setIsConsultationActive(false)
      return
    }

    try {
      setSaving(true)
      setError(null)
      await updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED)
      emitDataChanged({ entity: "appointment", action: "updated" })
      setIsConsultationActive(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar la consulta")
    } finally {
      setSaving(false)
    }
  }

  const close = () => { if (dirty || newMed.name || newMed.dosage || newMed.frequency) setConfirmClose(true); else onClose() }
  const selectRecord = (record: MedicalRecord) => {
    if (isConsultationActive) return
    setSelectedRecordId(record.id)
    setDiagnosis(record.diagnosis ?? ""); setTreatment(record.treatment_plan ?? "")
    setLmp(record.gynoRecord?.last_menstrual_period?.slice(0, 10) ?? "")
    setUploads(record.gynoRecord?.image_url ? [record.gynoRecord.image_url] : [])
    const prescription = record.prescriptions?.[0]
    setPrescriptionNotes(prescription?.additional_notes ?? "")
    setMedications((prescription?.medications ?? []).map((m, i) => ({ ...m, id: `history-${i}` })))
    setToothConditions((record.dentalRecords ?? []).reduce<Record<number, ToothCondition>>((acc, tooth) => { if (tooth.condition) acc[tooth.tooth_number] = tooth.condition as ToothCondition; return acc }, {}))
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent showCloseButton={false} aria-describedby="clinical-description" className="flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none">
        <DialogDescription id="clinical-description" className="sr-only">Expediente e historial del paciente. {isConsultationActive ? "Consulta activa" : "Modo lectura"}.</DialogDescription>
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md text-sm font-semibold text-primary-foreground "
              style={{ backgroundColor: patient.avatarColor }}
            >
              {patient.avatarInitials}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold text-foreground">{patient.name}</DialogTitle>
              <p className="truncate text-xs text-muted-foreground">
                {patient.age !== null ? `${patient.age} años` : "Sin edad"} | {patient.reason || "Consulta general"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {records.length > 0 && <Button variant="outline" aria-label="Descargar registro PDF" disabled={downloadingPdf} onClick={() => void handleDownloadPdf()}><FileText size={16} /><span className="hidden sm:inline">{downloadingPdf ? "Generando…" : "PDF"}</span></Button>}
            {isConsultationActive ? (
              <span
                className="hidden rounded-md px-3 py-1 text-xs font-semibold sm:inline-flex"
                style={{ backgroundColor: "var(--ds-action-soft)", color: "var(--ds-action)" }}
              >
                Consulta activa
              </span>
            ) : (
              <span className="hidden rounded-md bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
                Solo lectura
              </span>
            )}

            {isConsultationActive ? (
              <button
                type="button"
                onClick={() => void handleFinishConsultation()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary disabled:opacity-60"
              >
                <X size={12} />
                {saving ? "Finalizando..." : "Finalizar consulta"}
              </button>
            ) : canEdit ? (
              <button
                type="button"
                disabled={loading || !apiPatient} onClick={() => setIsConsultationActive(true)}
                className="citabox-action flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-95"
                style={{ backgroundColor: "var(--ds-action)" }}
              >
                Iniciar consulta
              </button>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ds-surface-alt)] text-muted-foreground transition-all hover:text-foreground"
              aria-label="Cerrar expediente"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-4 pt-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.key ? "bg-accent text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">
          <aside className="flex max-h-44 shrink-0 gap-2 overflow-auto border-b border-border bg-muted p-4 lg:max-h-none lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
            <p className="hidden px-2 py-2 text-sm font-semibold lg:block">Historia clínica</p>
            {records.map(record => <button key={record.id} disabled={isConsultationActive} onClick={() => selectRecord(record)} className={`min-w-40 rounded-md border p-3 text-left ${selectedRecordId === record.id ? "border-primary bg-accent" : "border-transparent hover:bg-card"}`}><span className="block text-sm font-medium">{formatClinicDateTime(record.createdAt, { dateStyle: "medium" })}</span><span className="mt-1 block text-xs text-muted-foreground">{record.diagnosis || "Registro clínico"}</span></button>)}
            {!loading && !records.length && <p className="px-2 text-sm text-muted-foreground">Sin registros previos.</p>}
          </aside>
          <div className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 ${!isConsultationActive ? "clinical-document" : ""}`}>
          <p className="mb-5 text-xs text-muted-foreground" aria-live="polite">{isConsultationActive ? dirty ? "Cambios sin guardar" : "Consulta activa · Sin cambios pendientes" : "Lectura del expediente"}</p>
          {loading && <p className="mb-4 text-sm text-muted-foreground">Cargando expediente clínico...</p>}
          {error && <p className="mb-4 text-sm text-danger">{error}</p>}
          {saveMessage && <p className="mb-4 text-sm text-success">{saveMessage}</p>}

          {activeTab === "notes" && (
            <div className="flex max-w-4xl flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="clinical-diagnosis" className="text-xs font-semibold text-foreground">Diagnóstico</label>
                {isConsultationActive ? <textarea
                  id="clinical-diagnosis" aria-label="Diagnóstico" value={diagnosis}
                  onChange={(e) => { setDiagnosis(e.target.value); setDirty(true) }}
                  placeholder="Ingresa el diagnóstico..."
                  rows={3}
                  disabled={!isConsultationActive}
                  className="w-full resize-none rounded-md border border-input bg-[var(--ds-surface-alt)] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                /> : <p className="max-w-prose whitespace-pre-wrap text-base leading-relaxed">{diagnosis || "No registrado"}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="clinical-treatment" className="text-xs font-semibold text-foreground">Plan de tratamiento</label>
                {isConsultationActive ? <textarea
                  id="clinical-treatment" aria-label="Plan de tratamiento" value={treatment}
                  onChange={(e) => { setTreatment(e.target.value); setDirty(true) }}
                  placeholder="Ingresa el plan de tratamiento..."
                  rows={4}
                  disabled={!isConsultationActive}
                  className="w-full resize-none rounded-md border border-input bg-[var(--ds-surface-alt)] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                /> : <p className="whitespace-pre-wrap text-sm leading-relaxed">{treatment || "No registrado"}</p>}
              </div>

              <button
                type="button"
                onClick={saveClinicalNotes}
                disabled={!isConsultationActive || saving}
                className="citabox-action mt-2 w-full rounded-md py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar expediente clínico"}
              </button>


            </div>
          )}

          {activeTab === "odontogram" && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_280px] 2xl:items-start">
                <div className="overflow-hidden rounded-md border border-border bg-[var(--ds-surface-alt)] p-4 sm:p-6">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    {(Object.entries(conditionColors) as [ToothCondition, string][]).map(([condition, color]) => (
                      <div key={condition} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color, border: "1px solid var(--border)" }} />
                        {conditionLabels[condition]}
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded-md border border-border bg-card p-4 sm:p-6">
                    <div className="min-w-[760px]">
                      <div className="mb-2 flex justify-center">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Arcada superior</p>
                      </div>
                      <div className="mb-6 flex justify-center gap-2">
                        {UPPER_TEETH.map((tooth) => (
                          <ToothSVG
                            key={tooth}
                            number={tooth}
                            condition={toothConditions[tooth] || "healthy"}
                            onClick={() => setSelectedTooth(tooth)}
                            isUpper={true}
                            isSelected={selectedTooth === tooth}
                          />
                        ))}
                      </div>

                      <div className="mx-8 my-3 border-t-2 border-dashed border-border" />

                      <div className="mt-6 flex justify-center gap-2">
                        {LOWER_TEETH.map((tooth) => (
                          <ToothSVG
                            key={tooth}
                            number={tooth}
                            condition={toothConditions[tooth] || "healthy"}
                            onClick={() => setSelectedTooth(tooth)}
                            isUpper={false}
                            isSelected={selectedTooth === tooth}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex justify-center">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Arcada inferior</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="citabox-card p-4 lg:sticky lg:top-0">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Pieza seleccionada</p>
                      <h4 className="text-base font-semibold text-foreground">
                        {selectedTooth ? `Pieza ${selectedTooth}` : "Selecciona una pieza"}
                      </h4>
                    </div>
                    {selectedTooth && (
                      <button
                        type="button"
                        onClick={() => setSelectedTooth(null)}
                        className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {selectedTooth ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        Estado actual:{" "}
                        <span className="font-semibold text-foreground">
                          {selectedToothCondition ? conditionLabels[selectedToothCondition] : "Sano"}
                        </span>
                      </div>

                      {(Object.keys(conditionColors) as ToothCondition[]).map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => setCondition(selectedTooth, condition)}
                          className={`w-full rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                            selectedToothCondition === condition
                              ? "border-info bg-info-bg text-info"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: conditionColors[condition] }} />
                            {conditionLabels[condition]}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      Selecciona una pieza dental para consultar sus hallazgos.
                    </div>
                  )}
                </div>
              </div>

              {Object.entries(toothConditions).some(([, condition]) => condition !== "healthy") && (
                <div className="rounded-lg border border-border bg-card p-4 ">
                  <h4 className="mb-3 text-xs font-semibold text-foreground">Resumen de hallazgos</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(toothConditions) as [string, ToothCondition][])
                      .filter(([, condition]) => condition !== "healthy")
                      .map(([tooth, condition]) => (
                        <span
                          key={tooth}
                          className="rounded-md px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: "var(--ds-surface-alt)", color: conditionColors[condition] }}
                        >
                          #{tooth}: {conditionLabels[condition]}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={saveClinicalNotes}
                disabled={!isConsultationActive || saving}
                className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar odontograma en el expediente"}
              </button>
            </div>
          )}

          {activeTab === "gynae" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="emrview-field-1" className="text-xs font-semibold text-foreground">Fecha de última menstruación (FUM)</label>
                  {isConsultationActive ? (
                  <input id="emrview-field-1"
                    type="date"
                    disabled={!isConsultationActive} value={lmp}
                    onChange={(e) => { setLmp(e.target.value); setDirty(true) }}
                    className="w-full rounded-lg bg-muted px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40"
                  />
                  ) : <p className="text-base leading-relaxed">{lmp ? formatClinicDateFromKey(lmp, { dateStyle: "long" }) : "No registrado"}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="emrview-field-2" className="text-xs font-semibold text-foreground">Fecha probable de parto (FPP)</label>
                  {isConsultationActive ? (
                  <input id="emrview-field-2"
                    type="text"
                    readOnly disabled={!isConsultationActive}
                    value={edd || (isConsultationActive ? "Se calcula con la FUM" : "No registrado")}
                    className="w-full cursor-default rounded-lg bg-muted px-4 py-3 text-sm text-foreground outline-none"
                  />
                  ) : <p className="text-base leading-relaxed">{edd || "No registrado"}</p>}
                </div>
              </div>

              {gestWeeks !== null && gestWeeks >= 0 && (
                <div
                  className="rounded-lg border border-border p-4"
                  style={{ backgroundColor: "var(--ds-action-soft)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ds-action)" }}>
                    Edad gestacional
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{gestWeeks}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">semanas</p>
                  {edd && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Fecha estimada de parto: <span className="font-semibold text-foreground">{edd}</span>
                    </p>
                  )}
                </div>
              )}

              {isConsultationActive && (
              <button type="button" disabled={!isConsultationActive || uploadingFiles}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all ${
                  isDragOver ? "border-foreground bg-muted/60" : "border-border hover:border-muted-foreground"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  void handleClinicalUploads(Array.from(e.dataTransfer.files))
                }}
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.multiple = true
                  input.onchange = (event) => {
                    void handleClinicalUploads(Array.from((event.target as HTMLInputElement).files || []))
                  }
                  input.click()
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Upload size={20} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Suelta aquí las imágenes de ultrasonido</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {uploadingFiles ? "Subiendo archivos..." : "o selecciona imágenes PNG o JPG"}
                  </p>
                </div>
              </button>
              )}
              {!isConsultationActive && uploads.length === 0 && <p className="text-sm text-muted-foreground">No hay imágenes de ultrasonido en este registro.</p>}

              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploads.map((file) => (
                    <a key={file} href={file} target="_blank" rel="noreferrer" className="rounded-md border border-input px-3 py-2 text-sm font-medium text-primary underline">
                      Ver imagen · {file.split("/").pop() ?? file}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="flex flex-col gap-5">
              {isConsultationActive && <div className="rounded-lg border border-border bg-muted/40 p-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">Agregar medicamento</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="med-name" className="text-xs font-semibold text-foreground">Nombre del medicamento</label>
                    <input
                      type="text"
                      value={newMed.name}
                      id="med-name"
                      onChange={(e) => setNewMed((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Amoxicilina"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground  placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="med-dosage" className="text-xs font-semibold text-foreground">Dosis</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      id="med-dosage"
                      onChange={(e) => setNewMed((prev) => ({ ...prev, dosage: e.target.value }))}
                      placeholder="Ej. 500 mg"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground  placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="med-frequency" className="text-xs font-semibold text-foreground">Frecuencia</label>
                    <input
                      type="text"
                      value={newMed.frequency}
                      id="med-frequency"
                      onChange={(e) => setNewMed((prev) => ({ ...prev, frequency: e.target.value }))}
                      placeholder="Ej. 3 veces al día por 7 días"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground  placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addMedication}
                  disabled={!isConsultationActive || !newMed.name || !newMed.dosage || !newMed.frequency}
                  className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={13} />
                  Agregar medicamento
                </button>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label htmlFor="prescription-notes" className="text-xs font-semibold text-foreground">Notas de receta</label>
                  <textarea
                    value={prescriptionNotes}
                    id="prescription-notes"
                    onChange={(e) => { setPrescriptionNotes(e.target.value); setDirty(true) }}
                    placeholder="Indicaciones adicionales para el paciente"
                    rows={3}
                    disabled={!isConsultationActive}
                    className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground  placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>}

              {!isConsultationActive && <div><h3 className="mb-2 text-sm font-semibold">Indicaciones de la receta</h3><p className="max-w-prose whitespace-pre-wrap text-base leading-relaxed">{prescriptionNotes || "Sin indicaciones adicionales registradas."}</p></div>}

              {medications.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border bg-card ">
                  <div className="border-b border-border px-5 py-3">
                    <h4 className="text-xs font-semibold text-foreground">
                      Receta actual ({medications.length} medicamento{medications.length > 1 ? "s" : ""})
                    </h4>
                  </div>
                  <div className="flex flex-col">
                    {medications.map((medication) => (
                      <div key={medication.id} className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "var(--ds-action-soft)" }}>
                          <Pill size={14} style={{ color: "var(--ds-action)" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{medication.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {medication.dosage} - {medication.frequency}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedication(medication.id)}
                          disabled={!isConsultationActive}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition-all hover:text-destructive disabled:opacity-40"
                          aria-label={`Eliminar ${medication.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {medications.length === 0 && (
                <div className="rounded-lg border border-border bg-card p-8 text-center ">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Pill size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Aún no se han agregado medicamentos</p>
                  <p className="mt-1 text-sm text-muted-foreground">{isConsultationActive ? "Agrega los medicamentos de esta consulta." : "Este registro no contiene medicamentos."}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || records.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileText size={15} />
                {downloadingPdf ? "Generando PDF..." : "Generar PDF"}
              </button>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hay cambios sin guardar</AlertDialogTitle><AlertDialogDescription>Si sales del expediente, perderás los cambios de esta consulta que todavía no has guardado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Seguir editando</AlertDialogCancel><AlertDialogAction onClick={onClose}>Salir sin guardar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Dialog>
  )
}
