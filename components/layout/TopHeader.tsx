"use client"

import { useEffect, useState } from "react"
import { type Role, type AuthUser, type View } from "@/lib/store"
import { useTheme } from "next-themes"
import { Search, Bell, Plus, Sun, Moon, User, Settings, LogOut, Calendar, UserPlus, Menu, Shield, Stethoscope, ClipboardList, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TopHeaderProps {
  role: Role
  authUser: AuthUser
  onLogout: () => void
  onNewAppointment: () => void
  onNewPatient: () => void
  onViewChange: (view: View) => void
  onMenuClick: () => void
  onClinicSwitch: (clinicId: string) => void
}

const NOTIFICATIONS: Array<{ id: number; text: string; sub: string; unread: boolean }> = []

const titleByRole: Record<Role, string> = {
  admin: "Panel",
  receptionist: "Recepción",
  doctor: "Mi agenda",
}

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <Shield size={13} />,
  receptionist: <ClipboardList size={13} />,
  doctor: <Stethoscope size={13} />,
}

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  receptionist: "Recepción",
  doctor: "Doctor",
}

export function TopHeader({
  role,
  authUser,
  onLogout,
  onNewAppointment,
  onNewPatient,
  onViewChange,
  onMenuClick,
  onClinicSwitch,
}: TopHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials = authUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const email = authUser.email
  const displayRole = authUser.role === "SUPER_ADMIN" ? "Superadministrador" : roleLabels[role]

  return (
    <header className="h-[64px] shrink-0 flex items-center justify-between px-4 lg:px-6 bg-background border-b border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-all shadow-sm"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-sm lg:text-base font-bold text-foreground">{titleByRole[role]}</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en la plataforma..."
            className="w-full pl-8 pr-4 py-2 rounded-md text-sm bg-muted text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 rounded-md bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm">
              <Building2 size={13} />
              <span className="hidden lg:inline">
                {authUser.membership?.clinic_name ?? "Elegir clínica"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5">
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Cambiar clínica</p>
            </div>
            {authUser.memberships.map((membership) => (
              <DropdownMenuItem
                key={membership.clinic_id}
                onClick={() => onClinicSwitch(membership.clinic_id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                  authUser.membership?.clinic_id === membership.clinic_id ? "bg-foreground text-background" : ""
                }`}
              >
                <Building2 size={14} />
                <span className="truncate">{membership.clinic_name}</span>
                {authUser.membership?.clinic_id === membership.clinic_id && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background/20">
                    Activa
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              {roleIcons[role]}
              <span>{displayRole}</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm"
        >
          {mounted && isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 lg:px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
              <Plus size={14} />
              <span className="hidden lg:inline">Crear</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5">
            <DropdownMenuItem
              onClick={onNewAppointment}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            >
              <Calendar size={14} />
              Nueva cita
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onNewPatient}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            >
              <UserPlus size={14} />
              Nuevo paciente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <button className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative shadow-sm">
              <Bell size={15} />
              {NOTIFICATIONS.some((item) => item.unread) && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-sm"
                  style={{ backgroundColor: "var(--neon-green)" }}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-lg p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-foreground">Notificaciones</p>
              <span className="text-[10px] font-medium text-muted-foreground">
                {NOTIFICATIONS.filter((item) => item.unread).length} nuevas
              </span>
            </div>
            <div className="flex flex-col">
              {NOTIFICATIONS.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No hay notificaciones.
                </div>
              ) : (
                NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/60 cursor-pointer ${
                      n.unread ? "bg-muted/30" : ""
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-sm mt-1.5 shrink-0"
                      style={{
                        backgroundColor: n.unread ? "var(--neon-green)" : "transparent",
                        border: n.unread ? "none" : "1.5px solid var(--border)",
                      }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{n.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{n.sub}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                Cerrar
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 hover:opacity-90 transition-all"
              style={{ backgroundColor: "#3ECF62" }}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5">
            <div className="px-3 py-2.5 mb-1">
              <p className="text-xs font-bold text-foreground">{authUser.name}</p>
              <p className="text-[10px] text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => onViewChange("settings")}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            >
              <User size={14} />
              Mi perfil
            </DropdownMenuItem>
            {role === "admin" && (
              <DropdownMenuItem
                onClick={() => onViewChange("settings")}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
              >
                <Settings size={14} />
                Configuración
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={onLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut size={14} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
