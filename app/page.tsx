"use client"

import { useState, useEffect } from "react"
import { type Role, type View, type AuthUser, AUTH_ROLE_TO_ROLE, ROLE_TO_AUTH_ROLE, ROLE_NAMES } from "@/lib/store"
import { AuthScreen } from "@/components/auth/AuthScreen"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { NewAppointmentDialog, WalkInSheet, NewInvoiceDialog } from "@/components/layout/Modals"
import { AdminDashboard } from "@/components/views/AdminDashboard"
import { ReceptionistDashboard } from "@/components/views/ReceptionistDashboard"
import { DoctorDashboard } from "@/components/views/DoctorDashboard"
import { CalendarView } from "@/components/views/CalendarView"
import { BillingView } from "@/components/views/BillingView"
import { EMRView } from "@/components/views/EMRView"
import { PatientsView } from "@/components/views/PatientsView"
import { SettingsView } from "@/components/views/SettingsView"

const defaultViewPerRole: Record<Role, View> = {
  admin: "dashboard",
  receptionist: "front-desk",
  doctor: "schedule",
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [activeView, setActiveView] = useState<View>("dashboard")
  const [isDark, setIsDark] = useState(false)
  const [emrPatientId, setEmrPatientId] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Global modal state
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<{ date?: string; time?: string } | undefined>()
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [showNewInvoice, setShowNewInvoice] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user)
    setActiveView(defaultViewPerRole[AUTH_ROLE_TO_ROLE[user.role]])
    setEmrPatientId(null)
  }

  const handleLogout = () => {
    setAuthUser(null)
    setActiveView("dashboard")
    setEmrPatientId(null)
  }

  const handleRoleSwitch = (role: Role) => {
    const newAuthRole = ROLE_TO_AUTH_ROLE[role]
    setAuthUser({ name: ROLE_NAMES[role], role: newAuthRole })
    setActiveView(defaultViewPerRole[role])
    setEmrPatientId(null)
  }

  const openNewAppointment = (slot?: { date?: string; time?: string }) => {
    setNewAppointmentSlot(slot)
    setShowNewAppointment(true)
  }

  // If not authenticated, show only the auth screen
  if (!authUser) {
    return <AuthScreen onLogin={handleLogin} />
  }

  const role = AUTH_ROLE_TO_ROLE[authUser.role]

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <AdminDashboard onViewPatients={() => setActiveView("patients")} />
      case "front-desk":
        return (
          <ReceptionistDashboard
            onNewAppointment={() => openNewAppointment()}
            onWalkIn={() => setShowWalkIn(true)}
            onOpenEMR={(id) => setEmrPatientId(id)}
          />
        )
      case "schedule":
        return <DoctorDashboard onOpenEMR={(id) => setEmrPatientId(id)} />
      case "calendar":
        return <CalendarView onNewAppointment={openNewAppointment} />
      case "billing":
        return <BillingView onNewInvoice={() => setShowNewInvoice(true)} />
      case "patients":
      case "medical-records":
        return <PatientsView onOpenEMR={(id) => setEmrPatientId(id)} />
      case "settings":
        return <SettingsView />
      default:
        return <AdminDashboard onViewPatients={() => setActiveView("patients")} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
      <Sidebar
        role={role}
        authUser={authUser}
        activeView={activeView}
        onViewChange={setActiveView}
        isDark={isDark}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          role={role}
          authUser={authUser}
          isDark={isDark}
          onToggleDark={() => setIsDark((d) => !d)}
          onLogout={handleLogout}
          onNewAppointment={() => openNewAppointment()}
          onNewPatient={() => setShowWalkIn(true)}
          onNewInvoice={() => setShowNewInvoice(true)}
          onViewChange={setActiveView}
          onMenuClick={() => setMobileNavOpen(true)}
          onRoleSwitch={handleRoleSwitch}
        />
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>

      {/* EMR Modal */}
      {emrPatientId && (
        <EMRView patientId={emrPatientId} onClose={() => setEmrPatientId(null)} />
      )}

      {/* Global Modals */}
      <NewAppointmentDialog
        open={showNewAppointment}
        onClose={() => setShowNewAppointment(false)}
        preselectedSlot={newAppointmentSlot}
      />
      <WalkInSheet open={showWalkIn} onClose={() => setShowWalkIn(false)} />
      <NewInvoiceDialog open={showNewInvoice} onClose={() => setShowNewInvoice(false)} />
    </div>
  )
}
