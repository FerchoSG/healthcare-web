"use client"

import { type AuthUser, type Role, type View } from "@/lib/store"
import {
  Activity,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react"
import { BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  role: Role
  authUser: AuthUser
  activeView: View
  onViewChange: (view: View) => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navConfig: Record<Role, { icon: React.ReactNode; label: string; view: View }[]> = {
  admin: [
    { icon: <LayoutDashboard size={18} />, label: "Panel", view: "dashboard" },
    { icon: <Calendar size={18} />, label: "Calendario", view: "calendar" },
    { icon: <Users size={18} />, label: "Pacientes", view: "patients" },
    { icon: <Settings size={18} />, label: "Configuración", view: "settings" },
  ],
  receptionist: [
    { icon: <ClipboardList size={18} />, label: "Recepción", view: "front-desk" },
    { icon: <Calendar size={18} />, label: "Calendario", view: "calendar" },
    { icon: <Users size={18} />, label: "Pacientes", view: "patients" },
  ],
  doctor: [
    { icon: <Stethoscope size={18} />, label: "Mi agenda", view: "schedule" },
    { icon: <Users size={18} />, label: "Pacientes", view: "patients" },
  ],
}

const roleLabel: Record<Role, string> = {
  admin: "Administrador",
  receptionist: "Recepción",
  doctor: "Doctor",
}

function SidebarContent({
  role,
  authUser,
  activeView,
  onViewChange,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  role: Role
  authUser: AuthUser
  activeView: View
  onViewChange: (view: View) => void
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const navItems = navConfig[role]
  const displayRole = authUser.role === "SUPER_ADMIN" ? "Superadministrador" : roleLabel[role]
  const clinicSlug = authUser.membership?.clinic_slug
  const bookingHref = clinicSlug ? `/book/${clinicSlug}` : "/book"
  const portalHref = clinicSlug ? `/portal/${clinicSlug}` : "/portal"
  const initials = authUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleNav = (view: View) => {
    onViewChange(view)
    onClose?.()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col px-3 py-5">
        <div className={cn("mb-8 flex items-center gap-3 px-3", collapsed && "justify-center px-0")}>
          <div className="citabox-primary-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] shadow-md shadow-blue-900/10">
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-base font-extrabold tracking-tight text-foreground">{BRAND_NAME}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Clínica SaaS
              </span>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Menú</p>}
          {navItems.map((item) => {
            const isActive = activeView === item.view
            const button = (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "citabox-primary-gradient text-white shadow-md shadow-blue-900/10"
                    : "text-muted-foreground hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]",
                  collapsed && "mx-auto h-11 w-11 justify-center px-0",
                )}
              >
                {item.icon}
                {!collapsed && item.label}
              </button>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.view}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="rounded-md text-xs font-semibold">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return button
          })}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto mt-1 flex h-11 w-11 items-center justify-center rounded-[12px] text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]"
                >
                  <ExternalLink size={18} />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-md text-xs font-semibold">
                Reservas
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <a
                href={bookingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]"
              >
                <ExternalLink size={18} />
                Reservas
              </a>
              <a
                href={portalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]"
              >
                <ExternalLink size={18} />
                Portal del paciente
              </a>
            </>
          )}
        </nav>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)]",
              collapsed && "mx-auto h-10 w-10 justify-center px-0",
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Colapsar</>}
          </button>
        )}

        <div className="mt-auto">
          <div
            className={cn(
              "citabox-soft flex cursor-pointer items-center gap-2.5 rounded-[14px] px-3 py-2.5 transition-all hover:bg-[var(--brand-navy-soft)]",
              collapsed && "justify-center px-0",
            )}
          >
            <div className="citabox-coral-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{authUser.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{displayRole}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function Sidebar({
  role,
  authUser,
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col rounded-r-[28px] border-r border-white/70 bg-sidebar/95 shadow-[18px_0_50px_rgba(20,60,146,0.07)] backdrop-blur transition-all duration-300 lg:flex",
          collapsed ? "w-[78px]" : "w-[242px]",
        )}
      >
        <SidebarContent
          role={role}
          authUser={authUser}
          activeView={activeView}
          onViewChange={onViewChange}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(o) => !o && onMobileClose?.()}>
        <SheetContent side="left" className="w-[280px] rounded-r-[24px] p-0" aria-describedby={undefined}>
          <SheetHeader className="sr-only">
            <SheetTitle>Menú de navegación</SheetTitle>
            <SheetDescription>Navegación principal de {BRAND_NAME}</SheetDescription>
          </SheetHeader>
          <SidebarContent
            role={role}
            authUser={authUser}
            activeView={activeView}
            onViewChange={onViewChange}
            onClose={onMobileClose}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
