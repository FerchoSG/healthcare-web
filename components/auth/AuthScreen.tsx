"use client"

import { useState } from "react"
import { Eye, EyeOff, Activity, CheckCircle2 } from "lucide-react"

type AuthUser = { name: string; role: "ADMIN" | "RECEPTIONIST" | "DOCTOR" }

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void
}

const DEMO_USERS: { label: string; user: AuthUser; description: string }[] = [
  {
    label: "Log in as Admin",
    user: { name: "Fercho", role: "ADMIN" },
    description: "Full access — KPIs, Billing, Settings",
  },
  {
    label: "Log in as Receptionist",
    user: { name: "Maria", role: "RECEPTIONIST" },
    description: "Front Desk, Calendar, Patients",
  },
  {
    label: "Log in as Doctor",
    user: { name: "Dr. Carlos", role: "DOCTOR" },
    description: "Schedule, Patients, Medical Records",
  },
]

const FEATURES = [
  "Role-based access for Admin, Receptionist & Doctor",
  "Clinical EMR with interactive Odontogram",
  "Hacienda CR-compatible billing & invoicing",
  "Calendar with smart scheduling",
]

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [screen, setScreen] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form
  const [clinicName, setClinicName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin({ name: adminName || "Admin", role: "ADMIN" })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin({ name: "Fercho", role: "ADMIN" })
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "#008BB0" }}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top: Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            <Activity size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">DentCare Pro</span>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--neon-green)" }}
            >
              Healthcare SaaS Platform
            </p>
            <h2 className="text-4xl font-extrabold text-white leading-tight text-balance">
              Modern dental clinic management, all in one place.
            </h2>
            <p className="mt-4 text-base text-white/50 leading-relaxed">
              Streamline appointments, clinical records, billing, and team management with a platform built for Costa Rican dental practices.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--neon-green)" }}
                />
                <span className="text-sm text-white/70">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Testimonial */}
        <div className="relative z-10 p-5 rounded-md border border-white/10 bg-white/5">
          <p className="text-sm text-white/80 italic leading-relaxed">
            "DentCare Pro transformed how we manage our clinic. Patient flow is seamless and billing has never been easier."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "var(--neon-green)" }}
            >
              JR
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Dr. Jorge Rodriguez</p>
              <p className="text-[11px] text-white/40">Clinica Dental Moderna, San José</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base text-foreground">DentCare Pro</span>
        </div>

        <div className="w-full max-w-[400px]">
          {screen === "login" ? (
            <>
              {/* Login header */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your clinic account</p>
              </div>

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@clinic.cr"
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                >
                  Sign In
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">or try demo access</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Demo Access */}
              <div className="space-y-2.5">
                {DEMO_USERS.map(({ label, user, description }) => (
                  <button
                    key={user.role}
                    onClick={() => onLogin(user)}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-md border border-border bg-white shadow-sm hover:border-[var(--neon-green)] hover:bg-[var(--neon-green-bg)] group transition-all"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground group-hover:text-[var(--neon-green-text)] transition-colors">
                        {label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: "var(--neon-green)" }}
                    >
                      {user.name[0]}
                    </div>
                  </button>
                ))}
              </div>

              {/* Switch to register */}
              <p className="text-center text-xs text-muted-foreground mt-8">
                New clinic?{" "}
                <button
                  onClick={() => setScreen("register")}
                  className="font-semibold text-foreground hover:underline"
                >
                  Create an account
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Register header */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground">Register your clinic</h1>
                <p className="text-sm text-muted-foreground mt-1">Get started in under 2 minutes</p>
              </div>

              {/* Register form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Clinic Name</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clinica Dental Moderna"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Admin Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dr. Jorge Rodriguez"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="admin@clinic.cr"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-md text-sm font-bold hover:opacity-90 transition-all text-white mt-2 shadow-sm"
                  style={{ backgroundColor: "var(--neon-green)" }}
                >
                  Create Clinic Account
                </button>
              </form>

              {/* Switch to login */}
              <p className="text-center text-xs text-muted-foreground mt-8">
                Already have an account?{" "}
                <button
                  onClick={() => setScreen("login")}
                  className="font-semibold text-foreground hover:underline"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
