"use client"

import { use, useEffect, useState } from "react"
import { Activity, Calendar, LogOut } from "lucide-react"
import { getPublicClinic } from "@/services/booking.service"
import type { PublicClinic } from "@/types/api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type PatientProfile = {
  first_name: string
  last_name: string
  identification: string
}

type PortalAppointment = {
  id: string
  start_time: string
  status: string
  reason: string | null
  doctor: { first_name: string; last_name: string }
}

type Prescription = {
  id: string
  diagnosis: string | null
  treatment_plan: string | null
  createdAt: string
  doctor: { first_name: string; last_name: string }
}

export default function ClinicPortalPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>
}) {
  const { clinicSlug } = use(params)
  const [clinic, setClinic] = useState<PublicClinic | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [identification, setIdentification] = useState("")
  const [password, setPassword] = useState("")
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<PortalAppointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPublicClinic(clinicSlug).then(setClinic).catch((err) => setError(err instanceof Error ? err.message : "Clinic not found"))
  }, [clinicSlug])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${BASE_URL}/portal/profile`, { headers }).then((r) => r.json()),
      fetch(`${BASE_URL}/portal/appointments`, { headers }).then((r) => r.json()),
      fetch(`${BASE_URL}/portal/prescriptions`, { headers }).then((r) => r.json()),
    ])
      .then(([nextProfile, nextAppointments, nextPrescriptions]) => {
        setProfile(nextProfile)
        setAppointments(Array.isArray(nextAppointments) ? nextAppointments : [])
        setPrescriptions(Array.isArray(nextPrescriptions) ? nextPrescriptions : [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load portal"))
  }, [token])

  const login = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!clinic) return
    setError(null)
    const res = await fetch(`${BASE_URL}/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identification, password, clinic_id: clinic.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(Array.isArray(data.message) ? data.message.join(", ") : data.message)
      return
    }
    setToken(data.access_token)
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-transparent" />
      </div>
    )
  }

  if (!token || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <form onSubmit={login} className="w-full max-w-sm bg-white rounded-lg border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-md bg-[#008BB0] flex items-center justify-center">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">{clinic.name}</h1>
            <p className="text-xs text-slate-500">Patient Portal</p>
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <input value={identification} onChange={(e) => setIdentification(e.target.value)} placeholder="Identification" className="w-full px-4 py-3 rounded-md border border-slate-200 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 rounded-md border border-slate-200 text-sm" />
          <button className="w-full py-3 rounded-md bg-slate-900 text-white text-sm font-semibold">Sign In</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">{clinic.name}</span>
          <button onClick={() => setToken(null)} className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
            <LogOut size={14} />
          </button>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4 space-y-4">
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500">Welcome back</p>
          <h2 className="text-xl font-bold text-slate-900">Hello, {profile.first_name}</h2>
        </section>
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Appointments</h3>
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-md bg-slate-50 border border-slate-100 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-slate-900"><Calendar size={14} />{new Date(appointment.start_time).toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Dr. {appointment.doctor.first_name} {appointment.doctor.last_name} - {appointment.status}</p>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-sm text-slate-500">No appointments found.</p>}
          </div>
        </section>
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Prescriptions</h3>
          <div className="space-y-2">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="rounded-md bg-slate-50 border border-slate-100 p-3 text-sm">
                <p className="font-semibold text-slate-900">{prescription.diagnosis ?? "Medical note"}</p>
                <p className="text-xs text-slate-500 mt-1">{prescription.treatment_plan ?? "No treatment plan recorded"}</p>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-sm text-slate-500">No prescriptions found.</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
