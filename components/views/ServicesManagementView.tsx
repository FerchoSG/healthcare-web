"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  Clock,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  createService,
  deleteService,
  fetchDoctors,
  fetchServices,
  updateService,
} from "@/services/clinic-services.service"
import type {
  CreateServicePayload,
  DoctorSummary,
  Service,
  UpdateServicePayload,
} from "@/types/api"

interface FormState {
  name: string
  description: string
  duration_minutes: number
  price: number
  doctor_ids: string[]
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: 0,
  doctor_ids: [],
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`
}

export function ServicesManagementView() {
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [doctors, setDoctors] = useState<DoctorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState("")
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [svcData, docData] = await Promise.all([fetchServices(), fetchDoctors()])
      setServices(svcData)
      setDoctors(docData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()),
  )

  const openCreate = () => {
    setEditingService(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration_minutes: service.duration_minutes,
      price: service.price,
      doctor_ids: service.doctors.map((doctor) => doctor.id),
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const toggleDoctor = (doctorId: string) => {
    setForm((prev) => ({
      ...prev,
      doctor_ids: prev.doctor_ids.includes(doctorId)
        ? prev.doctor_ids.filter((id) => id !== doctorId)
        : [...prev.doctor_ids, doctorId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError("El nombre del servicio es obligatorio")
      return
    }
    if (form.duration_minutes < 1) {
      setFormError("La duración debe ser de al menos 1 minuto")
      return
    }
    if (form.price < 0) {
      setFormError("El precio no puede ser negativo")
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)

      if (editingService) {
        const payload: UpdateServicePayload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration_minutes: form.duration_minutes,
          price: form.price,
          doctor_ids: form.doctor_ids,
        }
        await updateService(editingService.id, payload)
        toast({ title: "Servicio actualizado", description: `"${form.name}" fue actualizado.` })
      } else {
        const payload: CreateServicePayload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration_minutes: form.duration_minutes,
          price: form.price,
          doctor_ids: form.doctor_ids.length ? form.doctor_ids : undefined,
        }
        await createService(payload)
        toast({ title: "Servicio creado", description: `"${form.name}" fue agregado.` })
      }

      setDialogOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "La operación falló")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (service: Service) => {
    setDeletingId(service.id)
    setDeletingName(service.name)
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setDeleting(true)
      await deleteService(deletingId)
      toast({ title: "Servicio eliminado", description: `"${deletingName}" fue eliminado.` })
      setDeletingId(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar el servicio"
      toast({ variant: "destructive", title: "Error", description: message })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ds-action)]" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando servicios...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-danger" />
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={load}
          className="citabox-action rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-95"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Catálogo de servicios</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {services.length} servicio{services.length !== 1 ? "s" : ""} configurado{services.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="citabox-action flex w-fit items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-95"
        >
          <Plus size={14} />
          Nuevo servicio
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar servicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-card py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-[var(--ds-action)] focus:ring-2 focus:ring-[var(--ds-action-soft)]"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card ">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              {["Servicio", "Duración", "Precio", "Doctores", "Estado", ""].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {search ? "No hay servicios que coincidan con la búsqueda." : "Aún no hay servicios. Crea el primero."}
                </td>
              </tr>
            ) : (
              filtered.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-border transition-all last:border-0 hover:bg-card"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground">{service.name}</span>
                      {service.description && (
                        <span className="line-clamp-1 text-xs text-muted-foreground">{service.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Clock size={12} className="text-muted-foreground" />
                      {formatDuration(service.duration_minutes)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <DollarSign size={12} className="text-muted-foreground" />
                      {formatPrice(service.price)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {service.doctors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {service.doctors.map((doctor) => (
                          <span
                            key={doctor.id}
                            className="inline-flex items-center gap-1 rounded-md border border-primary bg-accent px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {doctor.first_name} {doctor.last_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Todos los doctores</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        service.is_active ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {service.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition-all hover:bg-[var(--ds-action-soft)] hover:text-[var(--ds-action)]"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(service)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition-all hover:bg-danger-bg hover:text-danger"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto border border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingService ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-md border border-danger bg-danger-bg px-3 py-2 text-xs text-danger">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="servicesmanagementview-field-1" className="text-xs font-semibold text-foreground">
                Nombre del servicio <span className="text-danger">*</span>
              </label>
              <input id="servicesmanagementview-field-1"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej. Consulta general"
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--ds-action)] focus:ring-2 focus:ring-[var(--ds-action-soft)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="servicesmanagementview-field-2" className="text-xs font-semibold text-foreground">Descripción</label>
              <textarea id="servicesmanagementview-field-2"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción breve del servicio"
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--ds-action)] focus:ring-2 focus:ring-[var(--ds-action-soft)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="servicesmanagementview-field-3" className="text-xs font-semibold text-foreground">
                  Duración (minutos) <span className="text-danger">*</span>
                </label>
                <input id="servicesmanagementview-field-3"
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, duration_minutes: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--ds-action)] focus:ring-2 focus:ring-[var(--ds-action-soft)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="servicesmanagementview-field-4" className="text-xs font-semibold text-foreground">
                  Precio (colones CRC) <span className="text-danger">*</span>
                </label>
                <input id="servicesmanagementview-field-4"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--ds-action)] focus:ring-2 focus:ring-[var(--ds-action-soft)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground">Doctores asignados</label>
              <p className="text-xs text-muted-foreground">
                Déjalo sin seleccionar para permitir todos los doctores. Elige doctores específicos para restringirlo.
              </p>
              <div className="max-h-40 divide-y divide-border overflow-y-auto rounded-md border border-border">
                {doctors.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No se encontraron doctores en esta clínica.
                  </div>
                ) : (
                  doctors.map((doctor) => (
                    <label
                      key={doctor.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2.5 transition-all hover:bg-card"
                    >
                      <Checkbox
                        checked={form.doctor_ids.includes(doctor.id)}
                        onCheckedChange={() => toggleDoctor(doctor.id)}
                        className="rounded-md"
                      />
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                          style={{ backgroundColor: "var(--ds-action)" }}
                        >
                          {doctor.first_name[0]}
                          {doctor.last_name[0]}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-xs font-medium text-foreground">
                            {doctor.first_name} {doctor.last_name}
                          </span>
                          {doctor.specialty && (
                            <span className="truncate text-xs text-muted-foreground">{doctor.specialty}</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {form.doctor_ids.length > 0 && (
                <p className="text-xs font-medium text-[var(--ds-action)]">
                  {form.doctor_ids.length} doctor{form.doctor_ids.length !== 1 ? "es" : ""} seleccionado{form.doctor_ids.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-card"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="citabox-action flex items-center gap-2 rounded-md px-5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-60"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {editingService ? "Guardar cambios" : "Crear servicio"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent aria-describedby={undefined} className="border border-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Eliminar servicio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground">
            ¿Seguro que deseas eliminar <strong>&quot;{deletingName}&quot;</strong>? Esta acción desactivará el servicio.
          </p>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              disabled={deleting}
              className="rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-card"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-md bg-danger-bg text-danger border border-danger px-5 py-2 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            >
              {deleting && <Loader2 size={13} className="animate-spin" />}
              Eliminar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
