"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, FileText, Pill, Plus, Trash2, Upload, X } from "lucide-react"
import {
  formatClinicDateTime,
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
  caries: "#EF4444",
  filling: "#F59E0B",
  crown: "#3B82F6",
  missing: "#6B7280",
  extraction: "#8B5CF6",
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

function avatarColor(label: string) {
  const colors = ["#008BB0", "#4ECDC4", "#45B7D1", "#96CEB4", "#F59E0B", "#8B5CF6"]
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function buildPatient(patient: Patient | null, records: MedicalRecord[]): DisplayPatient {
  if (!patient) {
    return {
      id: "",
      name: "Paciente",
      age: null,
      phone: null,
      avatarInitials: "P",
      avatarColor: "#008BB0",
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
        isSelected ? "bg-sky-50 ring-2 ring-sky-500/60" : "hover:bg-muted/40"
      }`}
      title={`Pieza ${number}: ${conditionLabels[condition]}`}
    >
      {isUpper && <span className="text-[9px] font-medium text-muted-foreground">{number}</span>}
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
          stroke={condition === "healthy" ? "var(--border)" : color}
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
      {!isUpper && <span className="text-[9px] font-medium text-muted-foreground">{number}</span>}
    </button>
  )
}

export function EMRView({ patientId, onClose, initialConsultationActive = false, appointmentId = null }: EMRViewProps) {
  const [apiPatient, setApiPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [specialtyModules, setSpecialtyModules] = useState<string[]>(["GENERAL_MEDICINE", "PRESCRIPTIONS"])
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClinicalTab>("notes")
  const [isConsultationActive, setIsConsultationActive] = useState(initialConsultationActive)
  const [chiefComplaint, setChiefComplaint] = useState("")
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
    setIsConsultationActive(initialConsultationActive)
  }, [initialConsultationActive, patientId])

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
        setSpecialtyModules(
          clinic.specialty_modules?.length ? clinic.specialty_modules : ["GENERAL_MEDICINE", "PRESCRIPTIONS"],
        )
        const latestRecord = recordsRes[0]
        const latestPrescription = latestRecord?.prescriptions?.[0]
        setChiefComplaint(latestRecord?.diagnosis ?? "")
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

  const gestWeeks = lmp
    ? Math.floor((getClinicNowDate().getTime() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null

  const edd = lmp
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
        diagnosis: diagnosis || chiefComplaint || undefined,
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
      setSaveMessage("Expediente clínico guardado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el expediente clínico")
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    const latestRecord = records[0]
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
    setToothConditions((prev) => ({ ...prev, [tooth]: condition }))
    setSelectedTooth(tooth)
  }

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage || !newMed.frequency) return
    setMedications((prev) => [...prev, { ...newMed, id: `med-${Date.now()}` }])
    setNewMed({ name: "", dosage: "", frequency: "" })
  }

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((medication) => medication.id !== id))
  }

  const handleClinicalUploads = async (files: File[]) => {
    if (files.length === 0) return

    try {
      setUploadingFiles(true)
      setError(null)
      const uploaded = await uploadClinicalFiles(files)
      setUploads((prev) => [...prev, ...uploaded.map((file) => file.key)])
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir los archivos clínicos")
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleFinishConsultation = async () => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,27,63,0.34)] p-0 backdrop-blur-sm sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div className="flex h-full min-h-0 w-full flex-col border-0 border-border bg-white shadow-[0_30px_90px_rgba(20,60,146,0.2)] sm:h-[92vh] sm:w-[96vw] sm:max-w-6xl sm:rounded-[24px] sm:border">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[14px] text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: patient.avatarColor }}
            >
              {patient.avatarInitials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">{patient.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {patient.age !== null ? `${patient.age} años` : "Sin edad"} | {patient.reason || "Consulta general"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {isConsultationActive ? (
              <span
                className="hidden rounded-md px-3 py-1 text-[11px] font-semibold sm:inline-flex"
                style={{ backgroundColor: "var(--neon-green-bg)", color: "var(--neon-green-text)" }}
              >
                Consulta activa
              </span>
            ) : (
              <span className="hidden rounded-md bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
                Solo lectura
              </span>
            )}

            {isConsultationActive ? (
              <button
                type="button"
                onClick={() => void handleFinishConsultation()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-[12px] bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
              >
                <X size={12} />
                {saving ? "Finalizando..." : "Finalizar consulta"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsConsultationActive(true)}
                className="citabox-primary-gradient flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-95"
                style={{ backgroundColor: "var(--neon-green)" }}
              >
                Iniciar consulta
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--surface-soft)] text-muted-foreground transition-all hover:text-foreground"
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
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[12px] px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {loading && <p className="mb-4 text-sm text-muted-foreground">Cargando expediente clínico...</p>}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {saveMessage && <p className="mb-4 text-sm text-emerald-700">{saveMessage}</p>}

          {activeTab === "notes" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Motivo de consulta</label>
                <input
                  type="text"
                  placeholder="Describe el motivo de consulta..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={!isConsultationActive}
                  className="w-full rounded-[14px] border border-border bg-[var(--surface-soft)] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Diagnóstico</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Ingresa el diagnóstico..."
                  rows={3}
                  disabled={!isConsultationActive}
                  className="w-full resize-none rounded-[14px] border border-border bg-[var(--surface-soft)] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Plan de tratamiento</label>
                <textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Ingresa el plan de tratamiento..."
                  rows={4}
                  disabled={!isConsultationActive}
                  className="w-full resize-none rounded-[14px] border border-border bg-[var(--surface-soft)] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <button
                type="button"
                onClick={saveClinicalNotes}
                disabled={!isConsultationActive || saving}
                className="citabox-primary-gradient mt-2 w-full rounded-[12px] py-3 text-sm font-bold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar expediente clínico"}
              </button>

              {records.length > 0 && (
                <div className="citabox-card p-4">
                  <h4 className="mb-3 text-xs font-bold text-foreground">Registros recientes</h4>
                  <div className="flex flex-col gap-3">
                    {records.slice(0, 5).map((record) => (
                      <div key={record.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <p className="text-xs font-semibold text-foreground">
                          {formatClinicDateTime(record.createdAt, { dateStyle: "medium" })}
                        </p>
                        {record.diagnosis && <p className="mt-1 text-xs text-muted-foreground">{record.diagnosis}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "odontogram" && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                <div className="overflow-hidden rounded-[18px] border border-border bg-[var(--surface-soft)] p-4 sm:p-6">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    {(Object.entries(conditionColors) as [ToothCondition, string][]).map(([condition, color]) => (
                      <div key={condition} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color, border: "1px solid var(--border)" }} />
                        {conditionLabels[condition]}
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded-[18px] border border-border bg-white/90 p-4 sm:p-6">
                    <div className="min-w-[760px]">
                      <div className="mb-2 flex justify-center">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Arcada superior</p>
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
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Arcada inferior</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="citabox-card p-4 lg:sticky lg:top-0">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pieza seleccionada</p>
                      <h4 className="text-base font-bold text-foreground">
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
                              ? "border-sky-500 bg-sky-50 text-sky-900"
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
                      Toca una pieza dental para editar su condición sin menús flotantes ni scroll incómodo.
                    </div>
                  )}
                </div>
              </div>

              {Object.entries(toothConditions).some(([, condition]) => condition !== "healthy") && (
                <div className="rounded-lg border border-border bg-white p-4 shadow-md">
                  <h4 className="mb-3 text-xs font-bold text-foreground">Resumen de hallazgos</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(toothConditions) as [string, ToothCondition][])
                      .filter(([, condition]) => condition !== "healthy")
                      .map(([tooth, condition]) => (
                        <span
                          key={tooth}
                          className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: `${conditionColors[condition]}20`, color: conditionColors[condition] }}
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
                className="w-full rounded-md bg-foreground py-3 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar odontograma en el expediente"}
              </button>
            </div>
          )}

          {activeTab === "gynae" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Fecha de última menstruación (FUM)</label>
                  <input
                    type="date"
                    value={lmp}
                    onChange={(e) => setLmp(e.target.value)}
                    className="w-full rounded-lg bg-muted px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Fecha probable de parto (FPP)</label>
                  <input
                    type="text"
                    readOnly
                    value={edd || "Se calcula con la FUM"}
                    className="w-full cursor-default rounded-lg bg-muted px-4 py-3 text-sm text-foreground outline-none"
                  />
                </div>
              </div>

              {gestWeeks !== null && gestWeeks >= 0 && (
                <div
                  className="flex flex-col items-center justify-center rounded-lg p-6 text-center"
                  style={{ backgroundColor: "var(--neon-green-bg)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--neon-green-text)" }}>
                    Edad gestacional
                  </p>
                  <p className="mt-2 text-6xl font-extrabold text-foreground">{gestWeeks}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">semanas</p>
                  {edd && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Fecha estimada de parto: <span className="font-semibold text-foreground">{edd}</span>
                    </p>
                  )}
                </div>
              )}

              <div
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
                    {uploadingFiles ? "Subiendo archivos..." : "o haz clic para buscarlas - PNG, JPG, DICOM"}
                  </p>
                </div>
              </div>

              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploads.map((file) => (
                    <span key={file} className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                      {file.split("/").pop() ?? file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="flex flex-col gap-5">
              <div className="rounded-lg border border-border bg-muted/40 p-5">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">Agregar medicamento</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Nombre del medicamento</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Amoxicilina"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Dosis</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, dosage: e.target.value }))}
                      placeholder="Ej. 500 mg"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Frecuencia</label>
                    <input
                      type="text"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, frequency: e.target.value }))}
                      placeholder="Ej. 3 veces al día por 7 días"
                      disabled={!isConsultationActive}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addMedication}
                  disabled={!isConsultationActive || !newMed.name || !newMed.dosage || !newMed.frequency}
                  className="mt-4 flex items-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={13} />
                  Agregar medicamento
                </button>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Notas de receta</label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="Indicaciones adicionales para el paciente"
                    rows={3}
                    disabled={!isConsultationActive}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {medications.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border bg-white shadow-md">
                  <div className="border-b border-border px-5 py-3">
                    <h4 className="text-xs font-bold text-foreground">
                      Receta actual ({medications.length} medicamento{medications.length > 1 ? "s" : ""})
                    </h4>
                  </div>
                  <div className="flex flex-col">
                    {medications.map((medication) => (
                      <div key={medication.id} className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "var(--neon-green-bg)" }}>
                          <Pill size={14} style={{ color: "var(--neon-green)" }} />
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
                <div className="rounded-lg border border-border bg-white p-8 text-center shadow-md">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Pill size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Aún no se han agregado medicamentos</p>
                  <p className="mt-1 text-xs text-muted-foreground">Inicia una consulta y agrega los medicamentos arriba</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || records.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground py-3 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileText size={15} />
                {downloadingPdf ? "Generando PDF..." : "Generar PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
