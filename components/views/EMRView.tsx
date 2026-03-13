"use client"

import { useState } from "react"
import { PATIENTS, type ToothCondition, type Medication } from "@/lib/store"
import { X, Upload, FileText, Activity, Plus, Pill, Trash2 } from "lucide-react"

interface EMRViewProps {
  patientId: string
  onClose: () => void
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
  healthy: "Healthy",
  caries: "Caries",
  filling: "Filling",
  crown: "Crown",
  missing: "Missing",
  extraction: "Extraction",
}

// Upper teeth: 18-11 (right to left) then 21-28 (left to right)
// Lower teeth: 48-41 (right to left) then 31-38 (left to right)
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

function ToothSVG({
  number,
  condition,
  onClick,
  isUpper,
}: {
  number: number
  condition: ToothCondition
  onClick: () => void
  isUpper: boolean
}) {
  const color = conditionColors[condition]
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      title={`Tooth ${number}: ${conditionLabels[condition]}`}
    >
      {isUpper && (
        <span className="text-[9px] text-muted-foreground font-medium">{number}</span>
      )}
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="transition-transform group-hover:scale-110">
        {/* Root */}
        <path
          d={isUpper
            ? "M10 20 Q8 30 7 35 M14 22 Q14 32 14 36 M18 20 Q20 30 21 35"
            : "M10 16 Q8 6 7 1 M14 14 Q14 4 14 0 M18 16 Q20 6 21 1"
          }
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Crown */}
        <rect
          x="4" y={isUpper ? "4" : "18"}
          width="20" height="18"
          rx="6"
          fill={color}
          stroke={condition === "healthy" ? "var(--border)" : color}
          strokeWidth="1.5"
          className="transition-all"
        />
        {/* Fissure lines for detail */}
        {condition === "healthy" && (
          <>
            <path d="M14 7 L14 19" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <path d="M8 12 L20 12" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
          </>
        )}
      </svg>
      {!isUpper && (
        <span className="text-[9px] text-muted-foreground font-medium">{number}</span>
      )}
    </button>
  )
}

export function EMRView({ patientId, onClose }: EMRViewProps) {
  const patient = PATIENTS.find((p) => p.id === patientId) || PATIENTS[0]
  const [activeTab, setActiveTab] = useState<"notes" | "odontogram" | "gynae" | "prescriptions">("notes")
  const [isConsultationActive, setIsConsultationActive] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [toothConditions, setToothConditions] = useState<Record<number, ToothCondition>>({})
  const [lmp, setLmp] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploads, setUploads] = useState<string[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [newMed, setNewMed] = useState<Omit<Medication, "id">>({ name: "", dosage: "", frequency: "" })
  const setCondition = (tooth: number, condition: ToothCondition) => {
    setToothConditions((prev) => ({ ...prev, [tooth]: condition }))
    setSelectedTooth(null)
  }

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage || !newMed.frequency) return
    setMedications((prev) => [...prev, { ...newMed, id: `med-${Date.now()}` }])
    setNewMed({ name: "", dosage: "", frequency: "" })
  }

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  // Gestational weeks calc
  const gestWeeks = lmp
    ? Math.floor((new Date().getTime() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null

  const edd = lmp
    ? new Date(new Date(lmp).getTime() + 280 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  const tabs = [
    { key: "notes", label: "Clinical Notes", icon: <FileText size={13} /> },
    { key: "odontogram", label: "Odontogram", icon: <Activity size={13} /> },
    { key: "gynae", label: "Gynaecology", icon: <Activity size={13} /> },
    { key: "prescriptions", label: "Prescriptions", icon: <Pill size={13} /> },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white sm:rounded-lg shadow-lg border-0 sm:border border-border w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: patient.avatarColor }}
            >
              {patient.avatarInitials}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{patient.name}</h2>
              <p className="text-xs text-muted-foreground">Age {patient.age} — {patient.reason || "General Checkup"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {isConsultationActive ? (
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-md hidden sm:inline-flex"
                style={{ backgroundColor: "var(--neon-green-bg)", color: "var(--neon-green-text)" }}
              >
                Active Consultation
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-md bg-muted text-muted-foreground hidden sm:inline-flex">
                Read-only
              </span>
            )}
            {isConsultationActive ? (
              <button
                onClick={() => setIsConsultationActive(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all"
              >
                <X size={12} />
                End Consultation
              </button>
            ) : (
              <button
                onClick={() => setIsConsultationActive(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold hover:opacity-90 transition-all text-white"
                style={{ backgroundColor: "var(--neon-green)" }}
              >
                Start Consultation
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Clinical Notes */}
          {activeTab === "notes" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="Describe the chief complaint..."
                  defaultValue={patient.reason}
                  disabled={!isConsultationActive}
                  className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  rows={3}
                  disabled={!isConsultationActive}
                  className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Treatment Plan</label>
                <textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Enter treatment plan..."
                  rows={4}
                  disabled={!isConsultationActive}
                  className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Prescriptions</label>
                  <input
                    type="text"
                    placeholder="Add prescription..."
                    disabled={!isConsultationActive}
                    className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Next Visit</label>
                  <input
                    type="date"
                    disabled={!isConsultationActive}
                    className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                disabled={!isConsultationActive}
                className="w-full py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Clinical Notes
              </button>
            </div>
          )}

          {/* Odontogram */}
          {activeTab === "odontogram" && (
            <div className="flex flex-col gap-6">
              <div className="bg-muted/40 rounded-lg p-4 sm:p-6 border border-border">
                {/* Legend */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {(Object.entries(conditionColors) as [ToothCondition, string][]).map(([cond, color]) => (
                    <div key={cond} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, border: "1px solid var(--border)" }} />
                      {conditionLabels[cond]}
                    </div>
                  ))}
                </div>

                {/* Upper teeth */}
                <div className="flex justify-center mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Upper Jaw</p>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                <div className="flex justify-center gap-1 mb-4 min-w-[520px]">
                  {UPPER_TEETH.map((tooth) => (
                    <div key={tooth} className="relative">
                      <ToothSVG
                        number={tooth}
                        condition={toothConditions[tooth] || "healthy"}
                        onClick={() => setSelectedTooth(selectedTooth === tooth ? null : tooth)}
                        isUpper={true}
                      />
                      {selectedTooth === tooth && (
                        <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md border border-border shadow-xl p-2 min-w-[130px]">
                          <p className="text-[10px] font-bold text-foreground mb-2 px-1">Tooth {tooth}</p>
                          {(Object.keys(conditionColors) as ToothCondition[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setCondition(tooth, c)}
                              className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted text-xs transition-all"
                            >
                              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: conditionColors[c] }} />
                              {conditionLabels[c]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div> {/* end upper scroll wrapper */}

                {/* Divider */}
                <div className="border-t-2 border-dashed border-border my-3 mx-8" />

                {/* Lower teeth */}
                <div className="overflow-x-auto no-scrollbar">
                <div className="flex justify-center gap-1 mt-4 min-w-[520px]">
                  {LOWER_TEETH.map((tooth) => (
                    <div key={tooth} className="relative">
                      <ToothSVG
                        number={tooth}
                        condition={toothConditions[tooth] || "healthy"}
                        onClick={() => setSelectedTooth(selectedTooth === tooth ? null : tooth)}
                        isUpper={false}
                      />
                      {selectedTooth === tooth && (
                        <div className="absolute z-20 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md border border-border shadow-xl p-2 min-w-[130px]">
                          <p className="text-[10px] font-bold text-foreground mb-2 px-1">Tooth {tooth}</p>
                          {(Object.keys(conditionColors) as ToothCondition[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setCondition(tooth, c)}
                              className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted text-xs transition-all"
                            >
                              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: conditionColors[c] }} />
                              {conditionLabels[c]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div> {/* end lower scroll wrapper */}
                <div className="flex justify-center mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Lower Jaw</p>
                </div>
              </div>

              {/* Legend summary */}
              {Object.keys(toothConditions).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground mb-3">Findings Summary</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(toothConditions) as [string, ToothCondition][])
                      .filter(([, cond]) => cond !== "healthy")
                      .map(([tooth, cond]) => (
                        <span
                          key={tooth}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: conditionColors[cond] + "20", color: conditionColors[cond] }}
                        >
                          #{tooth}: {conditionLabels[cond]}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gynaecology */}
          {activeTab === "gynae" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Last Menstrual Period (LMP)</label>
                  <input
                    type="date"
                    value={lmp}
                    onChange={(e) => setLmp(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Estimated Due Date (EDD)</label>
                  <input
                    type="text"
                    readOnly
                    value={edd || "Calculate from LMP"}
                    className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border-0 outline-none cursor-default"
                  />
                </div>
              </div>

              {gestWeeks !== null && gestWeeks >= 0 && (
                <div
                  className="rounded-lg p-6 flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: "var(--neon-green-bg)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--neon-green-text)" }}>
                    Gestational Age
                  </p>
                  <p className="text-6xl font-extrabold mt-2 text-foreground">{gestWeeks}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">weeks</p>
                  {edd && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Expected delivery: <span className="font-semibold text-foreground">{edd}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Ultrasound upload */}
              <div
                className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  isDragOver ? "border-foreground bg-muted/60" : "border-border hover:border-muted-foreground"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  const files = Array.from(e.dataTransfer.files).map((f) => f.name)
                  setUploads((prev) => [...prev, ...files])
                }}
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []).map((f) => f.name)
                    setUploads((prev) => [...prev, ...files])
                  }
                  input.click()
                }}
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Upload size={20} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Drop ultrasound images here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse — PNG, JPG, DICOM</p>
                </div>
              </div>

              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploads.map((file) => (
                    <span key={file} className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-md font-medium">
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions */}
          {activeTab === "prescriptions" && (
            <div className="flex flex-col gap-5">
              {/* Add Medication Form */}
              <div className="bg-muted/40 rounded-lg p-5 border border-border">
                <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest">Add Medication</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Medication Name</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Amoxicillin"
                      disabled={!isConsultationActive}
                      className="w-full px-4 py-2.5 rounded-lg bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Dosage</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g. 500mg"
                      disabled={!isConsultationActive}
                      className="w-full px-4 py-2.5 rounded-lg bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Frequency</label>
                    <input
                      type="text"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed((prev) => ({ ...prev, frequency: e.target.value }))}
                      placeholder="e.g. 3x daily for 7 days"
                      disabled={!isConsultationActive}
                      className="w-full px-4 py-2.5 rounded-lg bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <button
                  onClick={addMedication}
                  disabled={!isConsultationActive || !newMed.name || !newMed.dosage || !newMed.frequency}
                  className="mt-4 flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} />
                  Add Medication
                </button>
              </div>

              {/* Medications List */}
              {medications.length > 0 && (
                <div className="bg-white rounded-lg shadow-md border border-border overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <h4 className="text-xs font-bold text-foreground">
                      Current Prescription ({medications.length} medication{medications.length > 1 ? "s" : ""})
                    </h4>
                  </div>
                  <div className="flex flex-col">
                    {medications.map((med) => (
                      <div key={med.id} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--neon-green-bg)" }}>
                          <Pill size={14} style={{ color: "var(--neon-green)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.dosage} — {med.frequency}</p>
                        </div>
                        <button
                          onClick={() => removeMedication(med.id)}
                          disabled={!isConsultationActive}
                          className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-all disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {medications.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-8 border border-border text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                    <Pill size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No medications added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a consultation and add medications above</p>
                </div>
              )}

              {/* Generate PDF Button */}
              <button
                disabled={!isConsultationActive || medications.length === 0}
                className="w-full py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                Generate PDF & Sign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
