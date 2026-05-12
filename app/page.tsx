"use client"

import { useState, useEffect } from "react"
import { type Role, type View, type AuthUser, AUTH_ROLE_TO_ROLE, meToAuthUser } from "@/lib/store"
import { getAccessToken, getClinicId, setClinicId, clearAuth } from "@/lib/api-client"
import { fetchMe } from "@/services/appointments.service"
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
  const [authLoading, setAuthLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>("dashboard")
  const [emrPatientId, setEmrPatientId] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Global modal state
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<{ date?: string; time?: string } | undefined>()
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [showNewInvoice, setShowNewInvoice] = useState(false)

  // On mount: if we have a stored token, try to restore the session
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setAuthLoading(false)
      return
    }
    fetchMe()
      .then((me) => {
        let activeMe = me
        if (!activeMe.active_membership && activeMe.memberships.length > 0) {
          const storedClinic = getClinicId() ?? activeMe.memberships[0].clinic_id
          setClinicId(storedClinic)
          return fetchMe().then((nextMe) => {
            const user = meToAuthUser(nextMe)
            setAuthUser(user)
            setActiveView(defaultViewPerRole[AUTH_ROLE_TO_ROLE[user.role] ?? "admin"])
          })
        }
        const user = meToAuthUser(activeMe)
        setAuthUser(user)
        setActiveView(defaultViewPerRole[AUTH_ROLE_TO_ROLE[user.role] ?? "admin"])
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user)
    const role = AUTH_ROLE_TO_ROLE[user.role] ?? "admin"
    setActiveView(defaultViewPerRole[role])
    setEmrPatientId(null)
  }

  const handleLogout = () => {
    clearAuth()
    setAuthUser(null)
    setActiveView("dashboard")
    setEmrPatientId(null)
  }

  const handleClinicSwitch = async (clinicId: string) => {
    setClinicId(clinicId)
    const me = await fetchMe()
    const user = meToAuthUser(me)
    setAuthUser(user)
    const role = AUTH_ROLE_TO_ROLE[user.role] ?? "admin"
    setActiveView(defaultViewPerRole[role])
    setEmrPatientId(null)
  }

  const openNewAppointment = (slot?: { date?: string; time?: string }) => {
    setNewAppointmentSlot(slot)
    setShowNewAppointment(true)
  }

  // Show a loading spinner while we check if the token is still valid
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans" style={{ backgroundColor: "var(--app-bg)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  // If not authenticated, show only the auth screen
  if (!authUser) {
    return <AuthScreen onLogin={handleLogin} />
  }

  const role = AUTH_ROLE_TO_ROLE[authUser.role] ?? "admin"

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
        return (
          <DoctorDashboard
            onOpenEMR={(id) => setEmrPatientId(id)}
            doctorId={authUser.id}
            doctorName={authUser.name}
          />
        )
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
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          role={role}
          authUser={authUser}
          onLogout={handleLogout}
          onNewAppointment={() => openNewAppointment()}
          onNewPatient={() => setShowWalkIn(true)}
          onNewInvoice={() => setShowNewInvoice(true)}
          onViewChange={setActiveView}
          onMenuClick={() => setMobileNavOpen(true)}
          onClinicSwitch={handleClinicSwitch}
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
