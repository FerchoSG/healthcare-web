"use client"

import { useEffect, useMemo, useState } from "react"
import { Phone, MoreHorizontal, Loader2, AlertCircle } from "lucide-react"
import type { Patient } from "@/types/api"
import { fetchPatients } from "@/services/patients.service"

interface PatientsViewProps {
  onOpenEMR?: (patientId: string) => void
}

export function PatientsView({ onOpenEMR }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchPatients({ page: 1, limit: 100 })
      setPatients(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const newThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return patients.filter((p) => new Date(p.createdAt).getTime() >= weekAgo).length
  }, [patients])

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return Number.isFinite(age) ? age : null
  }

  const getInitials = (patient: Patient) =>
    `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase()

  const getAvatarColor = (patient: Patient) => {
    const name = `${patient.first_name} ${patient.last_name}`
    const colors = ["#008BB0", "#4ECDC4", "#45B7D1", "#96CEB4", "#F59E0B", "#8B5CF6"]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Patients", value: String(total) },
          { label: "Loaded", value: String(patients.length) },
          { label: "New This Week", value: String(newThisWeek) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-md p-4 border border-border">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading patients...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12 gap-2 text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button onClick={load} className="text-sm font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* Patient Cards Grid */}
      {!loading && !error && patients.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No patients found</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow-md p-5 border border-border flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: getAvatarColor(patient) }}
                >
                  {getInitials(patient)}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{patient.first_name} {patient.last_name}</p>
                  <p className="text-xs text-muted-foreground">Age {getAge(patient.birth_date) ?? "N/A"}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${
                  "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                Active
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={11} />
                {patient.whatsapp_phone ?? "No phone"}
              </div>
              <p className="text-[11px] bg-muted rounded-md px-2.5 py-1 w-fit">{patient.identification}</p>
            </div>

            <div className="flex gap-2 mt-1">
              {onOpenEMR && (
                <button
                  onClick={() => onOpenEMR(patient.id)}
                  className="flex-1 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                >
                  Open Record
                </button>
              )}
              <button className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}
