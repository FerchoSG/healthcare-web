"use client"

import { useEffect, useState } from "react"
import { type AuthUser, type Role, type View } from "@/lib/store"
import { useTheme } from "next-themes"
import {
  Bell,
  Building2,
  Calendar,
  ClipboardList,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Stethoscope,
  Sun,
  User,
  UserPlus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  admin: "Panel administrativo",
  receptionist: "Recepción",
  doctor: "Mi agenda",
}

const subtitleByRole: Record<Role, string> = {
  admin: "Resumen operativo de la clínica",
  receptionist: "Cola de pacientes y cobros del día",
  doctor: "Consultas y expedientes clínicos",
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

  const displayRole = authUser.role === "SUPER_ADMIN" ? "Superadministrador" : roleLabels[role]

  return (
    <header className="mx-0 mb-3 flex min-h-[76px] shrink-0 items-center justify-between rounded-[22px] border border-white/70 bg-white/88 px-4 shadow-[0_18px_45px_rgba(20,60,146,0.08)] backdrop-blur dark:border-[var(--border)] dark:bg-[color-mix(in_srgb,var(--card)_92%,transparent)] lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand-navy)] text-white shadow-sm transition-all hover:bg-[var(--brand-navy-hover)] lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={17} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-foreground lg:text-xl">{titleByRole[role]}</h1>
          <p className="hidden truncate text-xs font-medium text-muted-foreground sm:block">{subtitleByRole[role]}</p>
        </div>
      </div>

      <div className="hidden flex-1 justify-center px-5 xl:flex">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar pacientes, citas o servicios"
            className="h-11 w-full rounded-[14px] border border-border bg-[var(--surface-soft)] pl-10 pr-4 text-sm font-medium text-foreground shadow-inner outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--brand-navy)] focus:ring-4 focus:ring-[var(--brand-navy-soft)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden h-10 items-center gap-2 rounded-[12px] border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm transition-all hover:bg-[var(--brand-navy-soft)] md:flex">
              <Building2 size={14} className="text-[var(--brand-navy)]" />
              <span className="max-w-[170px] truncate">{authUser.membership?.clinic_name ?? "Elegir clínica"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-[16px] p-2">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cambiar clínica</p>
            </div>
            {authUser.memberships.map((membership) => (
              <DropdownMenuItem
                key={membership.clinic_id}
                onClick={() => onClinicSwitch(membership.clinic_id)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold ${
                  authUser.membership?.clinic_id === membership.clinic_id ? "bg-[var(--brand-navy)] text-white" : ""
                }`}
              >
                <Building2 size={14} />
                <span className="truncate">{membership.clinic_name}</span>
                {authUser.membership?.clinic_id === membership.clinic_id && (
                  <span className="ml-auto rounded-[8px] bg-white/18 px-1.5 py-0.5 text-[10px] font-bold">Activa</span>
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
          className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-card text-muted-foreground shadow-sm transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]"
        >
          {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="citabox-primary-gradient flex h-10 items-center gap-2 rounded-[12px] px-3 text-xs font-bold text-white shadow-md shadow-blue-900/10 transition-all hover:brightness-95 lg:px-4">
              <Plus size={15} />
              <span className="hidden lg:inline">Crear</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[16px] p-2">
            <DropdownMenuItem onClick={onNewAppointment} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold">
              <Calendar size={14} />
              Nueva cita
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewPatient} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold">
              <UserPlus size={14} />
              Nuevo paciente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-card text-muted-foreground shadow-sm transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]">
              <Bell size={16} />
              {NOTIFICATIONS.some((item) => item.unread) && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--brand-coral)]" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 overflow-hidden rounded-[18px] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-bold text-foreground">Notificaciones</p>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {NOTIFICATIONS.filter((item) => item.unread).length} nuevas
              </span>
            </div>
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No hay notificaciones.</div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="citabox-coral-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-md shadow-red-900/10 transition-all hover:brightness-95">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-[16px] p-2">
            <div className="px-3 py-2.5">
              <p className="text-sm font-bold text-foreground">{authUser.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{authUser.email}</p>
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={() => onViewChange("settings")} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold">
              <User size={14} />
              Mi perfil
            </DropdownMenuItem>
            {role === "admin" && (
              <DropdownMenuItem onClick={() => onViewChange("settings")} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold">
                <Settings size={14} />
                Configuración
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={onLogout} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-red-600">
              <LogOut size={14} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
