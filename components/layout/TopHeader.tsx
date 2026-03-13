"use client"

import { type Role, type AuthUser, type View, ROLE_NAMES, ROLE_TO_AUTH_ROLE } from "@/lib/store"
import { Search, Bell, Plus, Sun, Moon, User, Settings, LogOut, Calendar, UserPlus, FileText, Menu, Shield, Stethoscope, ClipboardList } from "lucide-react"
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
  isDark: boolean
  onToggleDark: () => void
  onLogout: () => void
  onNewAppointment: () => void
  onNewPatient: () => void
  onNewInvoice: () => void
  onViewChange: (view: View) => void
  onMenuClick: () => void
  onRoleSwitch: (role: Role) => void
}

const NOTIFICATIONS = [
  { id: 1, text: "New walk-in patient arrived", sub: "Maria Gonzalez — Just now", unread: true },
  { id: 2, text: "Invoice #INV-008 paid", sub: "Carlos Rivera — 5 min ago", unread: true },
  { id: 3, text: "Appointment reminder", sub: "Oliver Chen at 10:30 — 12 min ago", unread: false },
]

const titleByRole: Record<Role, string> = {
  admin: "Dashboard",
  receptionist: "Front Desk",
  doctor: "My Schedule",
}

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <Shield size={13} />,
  receptionist: <ClipboardList size={13} />,
  doctor: <Stethoscope size={13} />,
}

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  receptionist: "Receptionist",
  doctor: "Doctor",
}

export function TopHeader({
  role,
  authUser,
  isDark,
  onToggleDark,
  onLogout,
  onNewAppointment,
  onNewPatient,
  onNewInvoice,
  onViewChange,
  onMenuClick,
  onRoleSwitch,
}: TopHeaderProps) {
  const initials = authUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const emailSlug = authUser.name.toLowerCase().replace(/\s/g, ".").replace("dr.", "")
  const email = `${emailSlug}@dentcare.cr`

  return (
    <header className="h-[64px] shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-border">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-all shadow-sm"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-sm lg:text-base font-bold text-foreground">{titleByRole[role]}</h1>
      </div>

      {/* Center: Search — hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-8 pr-4 py-2 rounded-md text-sm bg-muted text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-ring/40 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 lg:gap-2.5">
        {/* Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 rounded-md bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm">
              {roleIcons[role]}
              <span className="hidden lg:inline">View as: <span className="text-foreground">{roleLabels[role]}</span></span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5">
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Switch Role</p>
            </div>
            {(["admin", "receptionist", "doctor"] as const).map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => onRoleSwitch(r)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                  role === r ? "bg-foreground text-background" : ""
                }`}
              >
                {roleIcons[r]}
                {roleLabels[r]}
                {role === r && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background/20">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Create New dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* On mobile show icon-only, on desktop show label */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
              <Plus size={14} />
              <span className="hidden lg:inline">Create New</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5">
            <DropdownMenuItem
              onClick={onNewAppointment}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            >
              <Calendar size={14} />
              New Appointment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onNewPatient}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            >
              <UserPlus size={14} />
              New Patient
            </DropdownMenuItem>
            {role !== "doctor" && (
              <DropdownMenuItem
                onClick={onNewInvoice}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
              >
                <FileText size={14} />
                New Invoice
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative shadow-sm">
              <Bell size={15} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-sm"
                style={{ backgroundColor: "var(--neon-green)" }}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-lg p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-foreground">Notifications</p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: "var(--neon-green-bg)", color: "var(--neon-green-text)" }}
              >
                2 new
              </span>
            </div>
            <div className="flex flex-col">
              {NOTIFICATIONS.map((n) => (
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
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                Mark all as read
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile DropdownMenu */}
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
              My Profile
            </DropdownMenuItem>
            {role === "admin" && (
              <DropdownMenuItem
                onClick={() => onViewChange("settings")}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
              >
                <Settings size={14} />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={onLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut size={14} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
