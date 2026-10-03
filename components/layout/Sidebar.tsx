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
    { icon: <LayoutDashboard size={18} />, label: "Hoy", view: "dashboard" },
    { icon: <Calendar size={18} />, label: "Agenda", view: "calendar" },
    { icon: <Users size={18} />, label: "Pacientes", view: "patients" },
    { icon: <Settings size={18} />, label: "Configuración", view: "settings" },
  ],
  receptionist: [
    { icon: <ClipboardList size={18} />, label: "Recepción", view: "front-desk" },
    { icon: <Calendar size={18} />, label: "Agenda", view: "calendar" },
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
          <div className="citabox-action flex h-10 w-10 shrink-0 items-center justify-center rounded-md  ">
            <Activity size={16} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-base font-semibold tracking-tight text-foreground">{BRAND_NAME}</span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gestión clínica
              </span>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menú</p>}
          {navItems.map((item) => {
            const isActive = activeView === item.view
            const button = (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-accent text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]",
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
                  className="mx-auto mt-1 flex h-11 w-11 items-center justify-center rounded-md text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]"
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
                className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]"
              >
                <ExternalLink size={18} />
                Reservas
              </a>
              <a
                href={portalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]"
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
              "mb-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]",
              collapsed && "mx-auto h-10 w-10 justify-center px-0",
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Colapsar</>}
          </button>
        )}

        <div className="mt-auto">
          <div
            className={cn(
              "citabox-soft flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 transition-all hover:bg-[var(--ds-action-soft)]",
              collapsed && "justify-center px-0",
            )}
          >
            <div className="citabox-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{authUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{displayRole}</p>
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
          "hidden h-full shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-150 lg:flex",
          collapsed ? "w-[72px]" : "w-[224px]",
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
        <SheetContent side="left" className="w-[280px] p-0" aria-describedby={undefined}>
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
