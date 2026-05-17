"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Save, UserPlus, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServicesManagementView } from "./ServicesManagementView"
import { fetchCurrentClinic, updateCurrentClinic } from "@/services/clinics.service"
import {
  createClinicStaff,
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
import { BRAND_DOMAIN, BRAND_SUPPORT_EMAIL } from "@/lib/brand"

export function SettingsView() {
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
          : "Usuario agregado. El correo se omitió porque Postmark no está configurado.",
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

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      <div className="bg-white rounded-lg shadow-md border border-border overflow-hidden flex-1">
        <div className="px-6 pt-6 pb-0 border-b border-border">
          <h2 className="text-base font-bold text-foreground mb-4">Configuración</h2>
          <Tabs defaultValue="clinic">
            <TabsList className="mb-0 bg-transparent border-b-0 p-0 gap-1">
              <TabsTrigger value="clinic" className="rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Perfil de clínica
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Equipo
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Servicios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinic" className="p-4 sm:p-6 mt-0">
              {loadingClinic ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando clínica...
                </div>
              ) : (
                <div className="max-w-lg flex flex-col gap-5">
                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Nombre</label>
                      <input
                        type="text"
                        value={clinic.name}
                        onChange={setField("name")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Cédula jurídica</label>
                      <input
                        type="text"
                        value={clinic.taxId}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm border border-border outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Teléfono</label>
                      <input
                        type="tel"
                        value={clinic.phone}
                        onChange={setField("phone")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Correo</label>
                      <input
                        type="email"
                        value={clinic.email}
                        onChange={setField("email")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Dirección</label>
                    <input
                      type="text"
                      value={clinic.address}
                      onChange={setField("address")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Tipo de clínica</label>
                      <select
                        value={clinic.clinicType}
                        onChange={(e) => setClinicType(e.target.value as ClinicType)}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
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
                      <label className="text-xs font-semibold text-foreground">Teléfono público</label>
                      <input
                        type="tel"
                        value={clinic.publicPhone}
                        onChange={setField("publicPhone")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Correo público</label>
                      <input
                        type="email"
                        value={clinic.publicEmail}
                        onChange={setField("publicEmail")}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
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
                    Habilitar booking en línea
                  </label>

                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                    El dominio sugerido para v1 es <span className="font-semibold text-foreground">{BRAND_DOMAIN}</span>. El soporte operativo se centraliza en <span className="font-semibold text-foreground">{BRAND_SUPPORT_EMAIL}</span>.
                  </div>

                  <button
                    onClick={handleSaveClinic}
                    disabled={savingClinic}
                    className="w-fit px-6 py-2.5 rounded-md text-sm font-semibold transition-all text-white disabled:opacity-50"
                    style={{ backgroundColor: saved ? "var(--neon-green)" : "var(--foreground)", color: saved ? "white" : "var(--background)" }}
                  >
                    {savingClinic ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff" className="p-4 sm:p-6 mt-0">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-muted-foreground">{staff.length} miembros activos</p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus size={13} />
                  Agregar usuario
                </button>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
              {inviteMessage && <p className="text-sm text-emerald-700 mb-4">{inviteMessage}</p>}

              {showInvite && (
                <div className="bg-muted/60 rounded-lg p-4 mb-5 border border-border">
                  <p className="text-xs font-bold text-foreground mb-3">Invitar integrante</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={inviteForm.firstName}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={inviteForm.lastName}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <select
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          role: e.target.value as Exclude<Role, Role.SUPER_ADMIN>,
                        }))
                      }
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
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
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    CitaBox generará una clave temporal y enviará el acceso por correo cuando Postmark esté configurado.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowInvite(false)} className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-xs font-semibold border border-border hover:text-foreground transition-all shadow-sm">
                      Cancelar
                    </button>
                    <button onClick={handleInvite} disabled={savingInvite} className="px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50">
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
                          <th key={header} className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member) => (
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
                                className="rounded-md border border-border bg-white px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                              >
                                <option value={Role.DOCTOR}>Doctor</option>
                                <option value={Role.STAFF}>Recepción</option>
                                <option value={Role.ADMIN}>Admin</option>
                              </select>
                            ) : (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
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
                                className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/40"
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
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                                  member.is_active === false
                                    ? "bg-red-50 text-red-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {member.is_active === false ? "Inactivo" : "Activo"}
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
                                  className="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-[11px] font-semibold text-background hover:opacity-90 disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  {savingMemberId === member.membership_id ? "Guardando..." : "Guardar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditMember}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                >
                                  <X size={12} />
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditMember(member)}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted"
                              >
                                <Pencil size={12} />
                                Editar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
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
