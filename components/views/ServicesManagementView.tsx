"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchDoctors,
} from "@/services/clinic-services.service"
import type {
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  DoctorSummary,
} from "@/types/api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function ServicesManagementView() {
  const { toast } = useToast()

  // Data
  const [services, setServices] = useState<Service[]>([])
  const [doctors, setDoctors] = useState<DoctorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Search
  const [search, setSearch] = useState("")

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [svcData, docData] = await Promise.all([
        fetchServices(),
        fetchDoctors(),
      ])
      setServices(svcData)
      setDoctors(docData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load data"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Filtered services ─────────────────────────────────────────────────────

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  // ── Dialog open/close ─────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingService(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (svc: Service) => {
    setEditingService(svc)
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      duration_minutes: svc.duration_minutes,
      price: svc.price,
      doctor_ids: svc.doctors.map((d) => d.id),
    })
    setFormError(null)
    setDialogOpen(true)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError("Service name is required")
      return
    }
    if (form.duration_minutes < 1) {
      setFormError("Duration must be at least 1 minute")
      return
    }
    if (form.price < 0) {
      setFormError("Price cannot be negative")
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
        toast({ title: "Service updated", description: `"${form.name}" has been updated.` })
      } else {
        const payload: CreateServicePayload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration_minutes: form.duration_minutes,
          price: form.price,
          doctor_ids: form.doctor_ids.length ? form.doctor_ids : undefined,
        }
        await createService(payload)
        toast({ title: "Service created", description: `"${form.name}" has been added.` })
      }

      setDialogOpen(false)
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Operation failed"
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = (svc: Service) => {
    setDeletingId(svc.id)
    setDeletingName(svc.name)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      await deleteService(deletingId)
      toast({ title: "Service deleted", description: `"${deletingName}" has been removed.` })
      setDeletingId(null)
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed"
      toast({ variant: "destructive", title: "Error", description: message })
    } finally {
      setDeleting(false)
    }
  }

  // ── Doctor toggle ─────────────────────────────────────────────────────────

  const toggleDoctor = (doctorId: string) => {
    setForm((prev) => ({
      ...prev,
      doctor_ids: prev.doctor_ids.includes(doctorId)
        ? prev.doctor_ids.filter((id) => id !== doctorId)
        : [...prev.doctor_ids, doctorId],
    }))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#008BB0]" />
        <span className="ml-2 text-sm text-slate-500">Loading services…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 rounded-md bg-[#008BB0] text-white text-xs font-semibold hover:opacity-90 transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Services Catalog</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {services.length} service{services.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#008BB0] text-white text-xs font-semibold hover:opacity-90 transition-all w-fit"
        >
          <Plus size={14} />
          New Service
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search services…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-md bg-white text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#008BB0]/30 focus:border-[#008BB0] transition-all"
        />
      </div>

      {/* Services table */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {["Service", "Duration", "Price", "Doctors", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold text-slate-500 px-5 py-3 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                  {search ? "No services match your search." : "No services yet. Create your first one."}
                </td>
              </tr>
            ) : (
              filtered.map((svc) => (
                <tr
                  key={svc.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-all"
                >
                  {/* Name & description */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground">{svc.name}</span>
                      {svc.description && (
                        <span className="text-[11px] text-slate-400 line-clamp-1">{svc.description}</span>
                      )}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock size={12} className="text-slate-400" />
                      {formatDuration(svc.duration_minutes)}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <DollarSign size={12} className="text-slate-400" />
                      {formatPrice(svc.price)}
                    </div>
                  </td>

                  {/* Doctors */}
                  <td className="px-5 py-3.5">
                    {svc.doctors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {svc.doctors.map((doc) => (
                          <span
                            key={doc.id}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100"
                          >
                            {doc.first_name} {doc.last_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">All doctors</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        svc.is_active
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-slate-500 bg-slate-100"
                      }`}
                    >
                      {svc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(svc)}
                        className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#008BB0] hover:bg-cyan-50 transition-all"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => confirmDelete(svc)}
                        className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete"
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

      {/* ── Create/Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white rounded-lg shadow-md border border-slate-200 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingService ? "Edit Service" : "New Service"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Teeth Cleaning"
                className="w-full px-3 py-2.5 rounded-md bg-white text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#008BB0]/30 focus:border-[#008BB0] transition-all"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the service"
                rows={2}
                className="w-full px-3 py-2.5 rounded-md bg-white text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#008BB0]/30 focus:border-[#008BB0] transition-all resize-none"
              />
            </div>

            {/* Duration & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2.5 rounded-md bg-white text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#008BB0]/30 focus:border-[#008BB0] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Price (cents CRC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2.5 rounded-md bg-white text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#008BB0]/30 focus:border-[#008BB0] transition-all"
                />
              </div>
            </div>

            {/* Doctor Assignment */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground">
                Assigned Doctors
              </label>
              <p className="text-[11px] text-slate-400">
                Leave unselected to allow all doctors. Select specific doctors to restrict.
              </p>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
                {doctors.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No doctors found in this clinic.
                  </div>
                ) : (
                  doctors.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <Checkbox
                        checked={form.doctor_ids.includes(doc.id)}
                        onCheckedChange={() => toggleDoctor(doc.id)}
                        className="rounded-[4px]"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                          style={{ backgroundColor: "#008BB0" }}
                        >
                          {doc.first_name[0]}{doc.last_name[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {doc.first_name} {doc.last_name}
                          </span>
                          {doc.specialty && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {doc.specialty}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {form.doctor_ids.length > 0 && (
                <p className="text-[11px] text-[#008BB0] font-medium">
                  {form.doctor_ids.length} doctor{form.doctor_ids.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-white text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#008BB0] text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {editingService ? "Save Changes" : "Create Service"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="bg-white rounded-lg shadow-md border border-slate-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Service
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>&quot;{deletingName}&quot;</strong>? This action will deactivate the service.
          </p>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setDeletingId(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-md bg-white text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-red-600 text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {deleting && <Loader2 size={13} className="animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
