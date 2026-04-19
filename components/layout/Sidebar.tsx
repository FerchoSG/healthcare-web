"use client"

import { type Role, type View, type AuthUser } from "@/lib/store"
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Settings,
  ClipboardList,
  Stethoscope,
  FileText,
  Activity,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  role: Role
  authUser: AuthUser
  activeView: View
  onViewChange: (view: View) => void
  isDark: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navConfig: Record<Role, { icon: React.ReactNode; label: string; view: View }[]> = {
  admin: [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", view: "dashboard" },
    { icon: <Calendar size={18} />, label: "Calendar", view: "calendar" },
    { icon: <Users size={18} />, label: "Patients", view: "patients" },
    { icon: <CreditCard size={18} />, label: "Billing", view: "billing" },
    { icon: <Settings size={18} />, label: "Settings", view: "settings" },
  ],
  receptionist: [
    { icon: <ClipboardList size={18} />, label: "Front Desk", view: "front-desk" },
    { icon: <Calendar size={18} />, label: "Calendar", view: "calendar" },
    { icon: <Users size={18} />, label: "Patients", view: "patients" },
    { icon: <CreditCard size={18} />, label: "Billing", view: "billing" },
  ],
  doctor: [
    { icon: <Stethoscope size={18} />, label: "My Schedule", view: "schedule" },
    { icon: <Users size={18} />, label: "Patients", view: "patients" },
    { icon: <FileText size={18} />, label: "Medical Records", view: "medical-records" },
  ],
}

const roleLabel: Record<Role, string> = {
  admin: "Administrator",
  receptionist: "Receptionist",
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
      <div className="flex flex-col h-full px-3 py-4">
        {/* Logo */}
        <div className={cn("flex items-center gap-2.5 px-3 mb-6", collapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--neon-green)" }}>
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && <span className="font-bold text-base text-foreground tracking-tight">CitaBox</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>}
          {navItems.map((item) => {
            const isActive = activeView === item.view
            const button = (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0 w-10 h-10 mx-auto"
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
                  href="/book"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all mt-1"
                >
                  <ExternalLink size={18} />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-md text-xs font-semibold">
                Patient Booking
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <a
                href="/book"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all mt-1"
              >
                <ExternalLink size={18} />
                Patient Booking
              </a>
              <a
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <ExternalLink size={18} />
                Patient Portal
              </a>
            </>
          )}
        </nav>

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-2",
              collapsed && "justify-center px-0 w-10 h-10 mx-auto"
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
          </button>
        )}

        {/* User card */}
        <div className="mt-auto">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-muted cursor-pointer transition-all",
            collapsed && "justify-center px-0"
          )}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: "var(--neon-green)" }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{authUser.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{roleLabel[role]}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function Sidebar({ role, authUser, activeView, onViewChange, collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — only visible on lg+ */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col h-full bg-white border-r border-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[220px]"
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

      {/* Mobile sidebar — Sheet from left */}
      <Sheet open={mobileOpen} onOpenChange={(o) => !o && onMobileClose?.()}>
        <SheetContent side="left" className="w-[260px] p-0 rounded-r-lg" aria-describedby={undefined}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for CitaBox</SheetDescription>
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
