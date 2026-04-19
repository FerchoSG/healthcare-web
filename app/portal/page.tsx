"use client"

import { useState } from "react"
import { PATIENT_PORTAL_DATA } from "@/lib/store"
import {
  Activity,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Download,
  LogOut,
  ChevronRight,
  Pill,
  History,
  CheckCircle,
} from "lucide-react"

type PortalView = "login" | "home"

export default function PatientPortalPage() {
  const [view, setView] = useState<PortalView>("login")
  const [identification, setIdentification] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setView("home")
  }

  if (view === "login") {
    return <PatientLogin onLogin={handleLogin} identification={identification} setIdentification={setIdentification} password={password} setPassword={setPassword} onDemoLogin={() => setView("home")} />
  }

  return <PatientHome onLogout={() => setView("login")} />
}

function PatientLogin({
  onLogin,
  identification,
  setIdentification,
  password,
  setPassword,
  onDemoLogin,
}: {
  onLogin: (e: React.FormEvent) => void
  identification: string
  setIdentification: (v: string) => void
  password: string
  setPassword: (v: string) => void
  onDemoLogin: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            <Activity size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Patient Portal</h1>
          <p className="text-xs text-muted-foreground mt-1">CitaBox — Secure Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-border shadow-sm">
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Identification (Cédula)</label>
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="1-0234-0567"
                className="w-full px-4 py-3 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-md bg-muted text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={onDemoLogin}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-lg border border-border bg-white shadow-sm hover:border-[var(--neon-green)] hover:bg-[var(--neon-green-bg)] group transition-all"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground group-hover:text-[var(--neon-green-text)] transition-colors">
                Demo Patient Access
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">View as Stacey Mitchell</p>
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: "var(--neon-green)" }}
            >
              SM
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function PatientHome({ onLogout }: { onLogout: () => void }) {
  const { patient, upcomingAppointment, prescriptions, pastAppointments } = PATIENT_PORTAL_DATA

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--neon-green)" }}
            >
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-foreground">CitaBox</span>
          </div>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        {/* Greeting */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              SM
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h2 className="text-lg font-extrabold text-foreground">Hello, {patient.name.split(" ")[0]}</h2>
            </div>
          </div>
        </div>

        {/* Upcoming Appointment */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--neon-green-bg)" }}>
              <Calendar size={14} style={{ color: "var(--neon-green)" }} />
            </div>
            <h3 className="text-sm font-bold text-foreground">My Upcoming Appointment</h3>
          </div>

          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: "var(--neon-green-bg)" }}
          >
            <div className="flex items-center gap-2.5">
              <Calendar size={14} style={{ color: "var(--neon-green-text)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--neon-green-text)" }}>
                {upcomingAppointment.date}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={14} style={{ color: "var(--neon-green-text)" }} />
              <span className="text-sm" style={{ color: "var(--neon-green-text)" }}>
                {upcomingAppointment.time}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <User size={14} style={{ color: "var(--neon-green-text)" }} />
              <span className="text-sm" style={{ color: "var(--neon-green-text)" }}>
                {upcomingAppointment.doctor}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={14} style={{ color: "var(--neon-green-text)" }} />
              <span className="text-sm" style={{ color: "var(--neon-green-text)" }}>
                {upcomingAppointment.location}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">{upcomingAppointment.reason}</span>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: "var(--neon-green-bg)", color: "var(--neon-green-text)" }}
            >
              Confirmed
            </span>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
              <Pill size={14} className="text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">My Prescriptions</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{rx.summary}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {rx.date} — {rx.doctor} — {rx.medications} medication{rx.medications > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 hover:opacity-80 transition-all text-white"
                  style={{ backgroundColor: "var(--neon-green)" }}
                  title="Download PDF"
                >
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Past Appointments */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
              <History size={14} className="text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Past Appointments</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {pastAppointments.map((apt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{apt.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {apt.date} — {apt.doctor}
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Book New */}
        <a
          href="/book"
          className="flex items-center justify-center gap-2 py-3.5 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Calendar size={15} />
          Book New Appointment
        </a>
      </div>
    </div>
  )
}
