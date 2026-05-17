"use client"

import { useState } from "react"
import { Activity, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { api, setAccessToken, setClinicId } from "@/lib/api-client"
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand"
import { CLINIC_TYPE_OPTIONS, defaultModulesForClinicType, type ClinicType } from "@/lib/clinic-types"
import { meToAuthUser, type AuthUser } from "@/lib/store"
import type { ClinicMembershipInfo, LoginResponse, MeResponse } from "@/types/api"

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void
}

const FEATURES = [
  "Accesos por rol para admin, recepcion y doctor",
  "Agenda multi clinica con citas y pacientes",
  "Expediente clinico con modulos por especialidad",
  "Booking publico y portal del paciente",
]

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [screen, setScreen] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingMemberships, setPendingMemberships] = useState<ClinicMembershipInfo[] | null>(null)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [clinicName, setClinicName] = useState("")
  const [clinicType, setClinicType] = useState<ClinicType>("GENERAL_MEDICINE")
  const [adminName, setAdminName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")

  const doLogin = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const loginRes = await api.post<LoginResponse>(
        "/auth/login",
        { email, password },
        { skipAuth: true },
      )
      setAccessToken(loginRes.access_token)

      if (loginRes.memberships.length === 0) {
        throw new Error("Tu usuario no tiene una clinica activa asociada")
      }

      if (loginRes.memberships.length > 1) {
        setPendingMemberships(loginRes.memberships)
        return
      }

      await selectClinic(loginRes.memberships[0].clinic_id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  const selectClinic = async (clinicId: string) => {
    setError(null)
    setLoading(true)
    try {
      setClinicId(clinicId)
      const me = await api.get<MeResponse>("/auth/me")
      onLogin(meToAuthUser(me))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la clinica")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    doLogin(loginEmail, loginPassword)
  }

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault()
    if (regPassword !== regConfirm) {
      setError("Las contrasenas no coinciden")
      return
    }
    setError(
      `El alta automatica de clinicas aun no esta cerrada. Usa un usuario existente o termina primero el flujo backend de registro para ${clinicName || "la clinica"}.`,
    )
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "#008BB0" }}
      >
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            <Activity size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">{BRAND_NAME}</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--neon-green)" }}>
              {BRAND_TAGLINE}
            </p>
            <h2 className="text-4xl font-extrabold text-white leading-tight text-balance">
              Operacion clinica clara, moderna y lista para Costa Rica.
            </h2>
            <p className="mt-4 text-base text-white/70 leading-relaxed">
              Centraliza agenda, pacientes, expediente medico, equipo clinico y acceso del paciente en una sola plataforma.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: "var(--neon-green)" }} />
                <span className="text-sm text-white/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 p-5 rounded-md border border-white/10 bg-white/5">
          <p className="text-sm text-white/80 italic leading-relaxed">
            "La operacion diaria necesita menos hojas sueltas y menos llamadas perdidas. Eso es exactamente lo que buscamos resolver."
          </p>
          <div className="mt-4">
            <p className="text-xs font-semibold text-white">Direccion de producto</p>
            <p className="text-[11px] text-white/50">Enfoque v1: agenda, pacientes, EMR y portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base text-foreground">{BRAND_NAME}</span>
        </div>

        <div className="w-full max-w-[400px]">
          {pendingMemberships ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground">Elegir clínica</h1>
                <p className="text-sm text-muted-foreground mt-1">Selecciona el espacio de trabajo que quieres abrir</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2.5">
                {pendingMemberships.map((membership) => (
                  <button
                    key={membership.clinic_id}
                    disabled={loading}
                    onClick={() => selectClinic(membership.clinic_id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-md border border-border bg-white shadow-sm hover:border-[var(--neon-green)] hover:bg-[var(--neon-green-bg)] group transition-all disabled:opacity-60"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground group-hover:text-[var(--neon-green-text)] transition-colors">
                        {membership.clinic_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{membership.role}</p>
                    </div>
                    {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </>
          ) : screen === "login" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground">Bienvenido de nuevo</h1>
                <p className="text-sm text-muted-foreground mt-1">Ingresa con tu cuenta de clínica</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Correo</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="usuario@clinica.cr"
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Contrasena</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="********"
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Ingresar
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-8">
                Nueva clínica?{" "}
                <button
                  onClick={() => setScreen("register")}
                  className="font-semibold text-foreground hover:underline"
                >
                  Preparar alta
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground">Preparar registro</h1>
                <p className="text-sm text-muted-foreground mt-1">Completa los datos base de la clínica para continuar el alta</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nombre de clínica</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clinica Integral San Carlos"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tipo de clínica</label>
                  <select
                    value={clinicType}
                    onChange={(e) => setClinicType(e.target.value as ClinicType)}
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  >
                    {CLINIC_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Modulos sugeridos: {defaultModulesForClinicType(clinicType).join(", ").toLowerCase().replaceAll("_", " ")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Administrador responsable</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dra. Ana Rojas"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Correo</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="admin@clinica.cr"
                    required
                    className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Contrasena</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="********"
                      required
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Confirmar contrasena</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="********"
                      required
                      className="w-full px-4 py-3 rounded-md bg-white shadow-sm text-foreground text-sm placeholder:text-muted-foreground border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
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
                  Guardar datos base
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-8">
                Ya tienes una cuenta?{" "}
                <button
                  onClick={() => setScreen("login")}
                  className="font-semibold text-foreground hover:underline"
                >
                  Ingresar
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
