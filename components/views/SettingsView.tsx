"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Save, Trash2, UserPlus, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServicesManagementView } from "./ServicesManagementView"
import { fetchCurrentClinic, updateCurrentClinic } from "@/services/clinics.service"
import {
  createClinicStaff,
  deleteClinicStaff,
  fetchClinicStaff,
  updateClinicStaff,
  type ClinicStaffMember,
} from "@/services/users.service"
import { Role } from "@/types/api"
import {
  CLINIC_TYPE_OPTIONS,
  SPECIALTY_MODULE_OPTIONS,
  defaultModulesForClinicType,
  type ClinicType,
  type SpecialtyModule,
} from "@/lib/clinic-types"

export function SettingsView() {
  const [staffFilter, setStaffFilter] = useState<"active" | "inactive" | "all">("active")
  const [clinic, setClinic] = useState({
    name: "",
    clinicType: "GENERAL_MEDICINE" as ClinicType,
    specialtyModules: ["GENERAL_MEDICINE", "PRESCRIPTIONS"] as SpecialtyModule[],
    taxId: "",
    phone: "",
    address: "",
    email: "",
    publicPhone: "",
    publicEmail: "",
    bookingEnabled: true,
  })
  const [staff, setStaff] = useState<ClinicStaffMember[]>([])
  const [loadingClinic, setLoadingClinic] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null)
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [savingClinic, setSavingClinic] = useState(false)
  const [savingInvite, setSavingInvite] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: Role.DOCTOR as Exclude<Role, Role.SUPER_ADMIN>,
    specialty: "",
  })
  const [editForm, setEditForm] = useState({
    role: Role.DOCTOR as Exclude<Role, Role.SUPER_ADMIN>,
    specialty: "",
    isActive: true,
  })

  useEffect(() => {
    fetchCurrentClinic()
      .then((data) => {
        setClinic({
          name: data.name,
          clinicType: (data.clinic_type || "GENERAL_MEDICINE") as ClinicType,
          specialtyModules: (data.specialty_modules?.length
            ? data.specialty_modules
            : ["GENERAL_MEDICINE", "PRESCRIPTIONS"]) as SpecialtyModule[],
          taxId: data.tax_id,
          phone: data.phone ?? "",
          address: data.address ?? "",
          email: data.email ?? "",
          publicPhone: data.public_phone ?? data.phone ?? "",
          publicEmail: data.public_email ?? data.email ?? "",
          bookingEnabled: data.booking_enabled,
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la clínica"))
      .finally(() => setLoadingClinic(false))

    fetchClinicStaff()
      .then(setStaff)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el equipo"))
      .finally(() => setLoadingStaff(false))
  }, [])

  const handleSaveClinic = async () => {
    try {
      setSavingClinic(true)
      setError(null)
      await updateCurrentClinic({
        name: clinic.name,
        clinic_type: clinic.clinicType,
        specialty_modules: clinic.specialtyModules,
        phone: clinic.phone,
        email: clinic.email,
        address: clinic.address,
        public_phone: clinic.publicPhone,
        public_email: clinic.publicEmail,
        booking_enabled: clinic.bookingEnabled,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la clínica")
    } finally {
      setSavingClinic(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email) {
      setError("Completa nombre y correo")
      return
    }

    try {
      setSavingInvite(true)
      setError(null)
      setInviteMessage(null)
      const created = await createClinicStaff({
        first_name: inviteForm.firstName,
        last_name: inviteForm.lastName,
        email: inviteForm.email,
        role: inviteForm.role,
        specialty: inviteForm.specialty || undefined,
      })
      setStaff((prev) => [...prev, created])
      setInviteForm({
        firstName: "",
        lastName: "",
        email: "",
        role: Role.DOCTOR,
        specialty: "",
      })
      setInviteMessage(
        created.invite_delivery === "sent"
          ? "Invitación enviada por correo."
          : "Usuario agregado. No se pudo enviar su invitación por correo. Contacta al administrador de la plataforma.",
      )
      setShowInvite(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el usuario")
    } finally {
      setSavingInvite(false)
    }
  }

  const startEditMember = (member: ClinicStaffMember) => {
    setEditingMembershipId(member.membership_id ?? null)
    setEditForm({
      role: member.role as Exclude<Role, Role.SUPER_ADMIN>,
      specialty: member.specialty ?? "",
      isActive: member.is_active ?? true,
    })
  }

  const cancelEditMember = () => {
    setEditingMembershipId(null)
    setSavingMemberId(null)
  }

  const handleSaveMember = async (member: ClinicStaffMember) => {
    if (!member.membership_id) {
      setError("No se pudo identificar la membresía del usuario")
      return
    }

    try {
      setSavingMemberId(member.membership_id)
      setError(null)
      const updated = await updateClinicStaff(member.membership_id, {
        role: editForm.role,
        specialty: editForm.specialty || undefined,
        is_active: editForm.isActive,
      })
      setStaff((prev) =>
        prev.map((item) => (item.membership_id === updated.membership_id ? updated : item)),
      )
      setEditingMembershipId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario")
    } finally {
      setSavingMemberId(null)
    }
  }

  const handleDeleteMember = async (member: ClinicStaffMember) => {
    if (!member.membership_id) {
      setError("No se pudo identificar la membresía del usuario")
      return
    }

    const confirmed = window.confirm(
      `Se eliminará a ${member.first_name} ${member.last_name} del equipo de esta clínica. ¿Deseas continuar?`,
    )
    if (!confirmed) return

    try {
      setDeletingMemberId(member.membership_id)
      setError(null)
      const removed = await deleteClinicStaff(member.membership_id)
      setStaff((prev) =>
        prev.map((item) => (item.membership_id === removed.membership_id ? removed : item)),
      )
      if (editingMembershipId === member.membership_id) {
        setEditingMembershipId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario")
    } finally {
      setDeletingMemberId(null)
    }
  }

  const setField = (key: keyof typeof clinic) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setClinic((prev) => ({ ...prev, [key]: event.target.value }))

  const setClinicType = (value: ClinicType) => {
    setClinic((prev) => ({
      ...prev,
      clinicType: value,
      specialtyModules: defaultModulesForClinicType(value),
    }))
  }

  const toggleSpecialtyModule = (module: SpecialtyModule) => {
    setClinic((prev) => {
      const modules = new Set(prev.specialtyModules)
      if (modules.has(module)) {
        if (module !== "GENERAL_MEDICINE") modules.delete(module)
      } else {
        modules.add(module)
      }
      modules.add("GENERAL_MEDICINE")
      return { ...prev, specialtyModules: [...modules] }
    })
  }

  const visibleStaff = staff.filter((member) => {
    const isDeleted = Boolean(member.deleted_at)
    const isInactive = member.is_active === false || isDeleted

    if (staffFilter === "active") {
      return !isInactive
    }

    if (staffFilter === "inactive") {
      return isInactive
    }

    return true
  })

  const activeCount = staff.filter((member) => member.is_active !== false && !member.deleted_at).length
  const inactiveCount = staff.filter((member) => member.is_active === false || Boolean(member.deleted_at)).length

  return (
    <div className="citabox-settings h-full overflow-y-auto rounded-md bg-card">
      <div className="min-h-full rounded-md border border-border bg-card  ">
        <div className="border-b border-border px-6 pb-0 pt-6">
          <div className="mb-5 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-action)]">Administración</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h2>
          </div>
          <Tabs defaultValue="clinic">
            <TabsList className="mb-0 flex w-full justify-start gap-1 overflow-x-auto rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger value="clinic" className="rounded-md rounded-b-none border-b-2 border-transparent px-3 py-3 sm:px-5 text-sm font-semibold transition-all data-[state=active]:border-[var(--ds-action)] data-[state=active]:bg-[var(--ds-action-soft)] data-[state=active]:text-[var(--ds-action)] data-[state=active]:shadow-none">
                Perfil de clínica
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-md rounded-b-none border-b-2 border-transparent px-3 py-3 sm:px-5 text-sm font-semibold transition-all data-[state=active]:border-[var(--ds-action)] data-[state=active]:bg-[var(--ds-action-soft)] data-[state=active]:text-[var(--ds-action)] data-[state=active]:shadow-none">
                Equipo
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-md rounded-b-none border-b-2 border-transparent px-3 py-3 sm:px-5 text-sm font-semibold transition-all data-[state=active]:border-[var(--ds-action)] data-[state=active]:bg-[var(--ds-action-soft)] data-[state=active]:text-[var(--ds-action)] data-[state=active]:shadow-none">
                Servicios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinic" className="mt-0 p-4 sm:p-6">
              {loadingClinic ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando clínica...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,720px)_minmax(320px,1fr)]">
                  <div className="citabox-card flex flex-col gap-5 p-6">
                  {error && <p className="text-sm text-danger">{error}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-1" className="text-xs font-semibold text-foreground">Nombre</label>
                      <input id="settingsview-field-1"
                        type="text"
                        value={clinic.name}
                        onChange={setField("name")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-2" className="text-xs font-semibold text-foreground">Cédula jurídica</label>
                      <input id="settingsview-field-2"
                        type="text"
                        value={clinic.taxId}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm border border-input outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-3" className="text-xs font-semibold text-foreground">Teléfono</label>
                      <input id="settingsview-field-3"
                        type="tel"
                        value={clinic.phone}
                        onChange={setField("phone")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-4" className="text-xs font-semibold text-foreground">Correo</label>
                      <input id="settingsview-field-4"
                        type="email"
                        value={clinic.email}
                        onChange={setField("email")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="settingsview-field-5" className="text-xs font-semibold text-foreground">Dirección</label>
                    <input id="settingsview-field-5"
                      type="text"
                      value={clinic.address}
                      onChange={setField("address")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-6" className="text-xs font-semibold text-foreground">Tipo de clínica</label>
                      <select id="settingsview-field-6"
                        value={clinic.clinicType}
                        onChange={(e) => setClinicType(e.target.value as ClinicType)}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      >
                        {CLINIC_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-foreground">Módulos clínicos</label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALTY_MODULE_OPTIONS.map((option) => (
                          <label key={option.value} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md border border-border">
                            <input
                              type="checkbox"
                              checked={clinic.specialtyModules.includes(option.value)}
                              disabled={option.value === "GENERAL_MEDICINE"}
                              onChange={() => toggleSpecialtyModule(option.value)}
                              className="h-3.5 w-3.5"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-7" className="text-xs font-semibold text-foreground">Teléfono público</label>
                      <input id="settingsview-field-7"
                        type="tel"
                        value={clinic.publicPhone}
                        onChange={setField("publicPhone")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="settingsview-field-8" className="text-xs font-semibold text-foreground">Correo público</label>
                      <input id="settingsview-field-8"
                        type="email"
                        value={clinic.publicEmail}
                        onChange={setField("publicEmail")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={clinic.bookingEnabled}
                      onChange={(e) => setClinic((prev) => ({ ...prev, bookingEnabled: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    Habilitar reservas en línea
                  </label>

                  <div className="rounded-md border border-border bg-[var(--ds-surface-alt)] p-4 text-xs text-muted-foreground">
                    Estos datos se muestran en las reservas y el portal del paciente. Mantén actualizados el contacto y los servicios de tu clínica.
                  </div>

                  <button
                    onClick={handleSaveClinic}
                    disabled={savingClinic}
                    className="citabox-action w-fit rounded-md px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
                  >
                    {savingClinic ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                  </div>

                  <aside className="flex flex-col gap-4">
                    <div className="rounded-lg border border-border bg-accent p-5 text-foreground">
                      <p className="text-xs font-semibold text-primary">Vista pública de la clínica</p>
                      <h3 className="mt-3 text-2xl font-semibold">{clinic.name || "Clínica"}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{clinic.address || "Dirección pendiente"}</p>
                    </div>
                    <div className="citabox-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado público</p>
                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between rounded-md bg-[var(--ds-surface-alt)] px-4 py-3">
                          <span className="text-sm font-semibold text-foreground">Reservas en línea</span>
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${clinic.bookingEnabled ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                            {clinic.bookingEnabled ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <div className="rounded-md bg-[var(--ds-surface-alt)] px-4 py-3">
                          <p className="text-xs font-semibold text-muted-foreground">Contacto público</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{clinic.publicPhone || "Sin teléfono"}</p>
                          <p className="text-xs text-muted-foreground">{clinic.publicEmail || "Sin correo"}</p>
                        </div>
                        <div className="rounded-md bg-[var(--ds-action-soft)] px-4 py-3">
                          <p className="text-xs font-semibold text-[var(--ds-action)]">Módulos habilitados</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{clinic.specialtyModules.length}</p>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff" className="p-4 sm:p-6 mt-0">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    {activeCount} activos, {inactiveCount} inactivos o eliminados
                  </p>
                  <div className="flex items-center gap-2">
                    {[
                      { value: "active", label: "Activos" },
                      { value: "inactive", label: "Inactivos" },
                      { value: "all", label: "Todos" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStaffFilter(option.value as "active" | "inactive" | "all")}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          staffFilter === option.value
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus size={13} />
                  Agregar usuario
                </button>
              </div>

              {error && <p className="text-sm text-danger mb-4">{error}</p>}
              {inviteMessage && <p className="text-sm text-success mb-4">{inviteMessage}</p>}

              {showInvite && (
                <div className="bg-muted/60 rounded-lg p-4 mb-5 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-3">Invitar integrante</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={inviteForm.firstName}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-card  text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={inviteForm.lastName}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-card  text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-card  text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <select
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          role: e.target.value as Exclude<Role, Role.SUPER_ADMIN>,
                        }))
                      }
                      className="px-3 py-2 rounded-md bg-card  text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      <option value={Role.DOCTOR}>Doctor</option>
                      <option value="STAFF">Recepción</option>
                      <option value={Role.ADMIN}>Admin</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Especialidad opcional"
                      value={inviteForm.specialty}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, specialty: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-card  text-foreground text-sm border border-input outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    CitaBox generará una clave temporal y enviará el acceso por correo cuando Resend esté configurado.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowInvite(false)} className="px-4 py-1.5 rounded-md bg-card text-muted-foreground text-xs font-semibold border border-border hover:text-foreground transition-all ">
                      Cancelar
                    </button>
                    <button onClick={handleInvite} disabled={savingInvite} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                      {savingInvite ? "Enviando..." : "Enviar invitación"}
                    </button>
                  </div>
                </div>
              )}

              {loadingStaff ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando equipo...
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {["Nombre", "Correo", "Rol", "Especialidad", "Estado", "Acciones"].map((header) => (
                          <th key={header} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleStaff.map((member) => (
                        <tr key={member.membership_id ?? member.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-all">
                          <td className="px-5 py-3.5 text-xs font-semibold text-foreground">
                            {member.first_name} {member.last_name}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">{member.email}</td>
                          <td className="px-5 py-3.5">
                            {editingMembershipId === member.membership_id ? (
                              <select
                                value={editForm.role}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    role: e.target.value as Exclude<Role, Role.SUPER_ADMIN>,
                                  }))
                                }
                                className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                              >
                                <option value={Role.DOCTOR}>Doctor</option>
                                <option value={Role.STAFF}>Recepción</option>
                                <option value={Role.ADMIN}>Admin</option>
                              </select>
                            ) : (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                                {member.role}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {editingMembershipId === member.membership_id ? (
                              <input
                                type="text"
                                value={editForm.specialty}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, specialty: e.target.value }))}
                                placeholder="General"
                                className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                              />
                            ) : (
                              member.specialty || "General"
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {editingMembershipId === member.membership_id ? (
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.isActive}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                                <span>{editForm.isActive ? "Activo" : "Inactivo"}</span>
                              </label>
                            ) : (
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                                  member.is_active === false || member.deleted_at
                                    ? "bg-danger-bg text-danger"
                                    : "bg-success-bg text-success"
                                }`}
                              >
                                {member.deleted_at ? "Eliminado" : member.is_active === false ? "Inactivo" : "Activo"}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {editingMembershipId === member.membership_id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleSaveMember(member)}
                                  disabled={savingMemberId === member.membership_id}
                                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  {savingMemberId === member.membership_id ? "Guardando..." : "Guardar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditMember}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                >
                                  <X size={12} />
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditMember(member)}
                                  disabled={deletingMemberId === member.membership_id || Boolean(member.deleted_at)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                                >
                                  <Pencil size={12} />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteMember(member)}
                                  disabled={deletingMemberId === member.membership_id || Boolean(member.deleted_at)}
                                  className="inline-flex items-center gap-1 rounded-md border border-danger bg-danger-bg px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
                                >
                                  <Trash2 size={12} />
                                  {deletingMemberId === member.membership_id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {visibleStaff.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-6 text-center text-sm text-muted-foreground">
                            No hay usuarios para este filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="p-4 sm:p-6 mt-0">
              <ServicesManagementView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
