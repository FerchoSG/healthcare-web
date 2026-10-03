"use client"
import { appointmentStatusClass, appointmentStatusLabel } from "@/lib/design"


import { useState, useEffect, useCallback } from "react"
import { UserPlus, CalendarPlus, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CITABOX_DATA_CHANGED_EVENT } from "@/lib/data-events"
import {
  formatClinicDateFromKey,
  formatClinicTime,
  getClinicTodayKey,
  shiftClinicDateKey,
} from "@/lib/clinic-time"
import { AppointmentStatus, PaymentMethod, PaymentStatus, type Appointment, type Invoice } from "@/types/api"
import { fetchAppointments, updateAppointmentStatus } from "@/services/appointments.service"
import { createInvoice, fetchInvoices, updateInvoice } from "@/services/billing.service"
import { useToast } from "@/hooks/use-toast"

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateLabel(dateStr: string) {
  const today = getClinicTodayKey()
  if (dateStr === today) return "Hoy"
  return formatClinicDateFromKey(dateStr, { weekday: "short", month: "short", day: "numeric" })
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_CONSULTATION,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
]

const STATUS_LABELS = Object.fromEntries(Object.values(AppointmentStatus).map(status => [status, appointmentStatusLabel(status)])) as Record<AppointmentStatus, string>
const statusColors = Object.fromEntries(Object.values(AppointmentStatus).map(status => [status, appointmentStatusClass(status)])) as Record<AppointmentStatus, string>
function getInitials(first: string, last: string) { return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() }
function getAvatarColor(_name: string) { return "var(--ds-action)" }
function formatTime(value: string) { return formatClinicTime(value) }

interface ReceptionistDashboardProps {
  onNewAppointment: () => void
  onWalkIn: () => void
  onOpenEMR: (patientId: string) => void
}

export function ReceptionistDashboard({ onNewAppointment, onWalkIn, onOpenEMR }: ReceptionistDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(() => getClinicTodayKey())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingWarning, setBillingWarning] = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [closingId, setClosingId] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCheckout, setSelectedCheckout] = useState<Appointment | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.SINPE_MOVIL)
  const [paymentReference, setPaymentReference] = useState("")
  const [paidAmountInput, setPaidAmountInput] = useState("")
  const [checkoutNotes, setCheckoutNotes] = useState("")
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setBillingWarning(null)

      const data = await fetchAppointments(selectedDate, selectedDate)
      setAppointments(data)

      try {
        const nextInvoices = await fetchInvoices()
        setInvoices(nextInvoices)
      } catch (err: unknown) {
        setInvoices([])
        setBillingWarning(
          err instanceof Error
            ? `La gesti\u00f3n de cobros no est\u00e1 disponible en este momento: ${err.message}`
            : "La gesti\u00f3n de cobros no est\u00e1 disponible en este momento.",
        )
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las citas.")
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => {
      void load()
    }
    window.addEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CITABOX_DATA_CHANGED_EVENT, handler)
  }, [load])

  const shiftDate = (days: number) => {
    setSelectedDate(shiftClinicDateKey(selectedDate, days))
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    const prev = appointments
    // Optimistic update
    setAppointments((a) => a.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)))
    setMutatingId(id)
    try {
      const updated = await updateAppointmentStatus(id, newStatus)
      setAppointments((a) => a.map((apt) => (apt.id === id ? updated : apt)))
    } catch (err: unknown) {
      // Rollback on error
      setAppointments(prev)
      toast({
        variant: "destructive",
        title: "No se pudo actualizar el estado",
        description: err instanceof Error ? err.message : "Error desconocido",
      })
    } finally {
      setMutatingId(null)
    }
  }

  const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED)
  const invoicesByAppointmentId = new Map(
    invoices
      .filter((invoice) => invoice.appointment_id)
      .map((invoice) => [invoice.appointment_id as string, invoice]),
  )
  const pendingClosures = completed.filter((appointment) => {
    const invoice = invoicesByAppointmentId.get(appointment.id)
    return !invoice || invoice.payment_status !== PaymentStatus.PAID
  })

  const openCheckout = (appointment: Appointment) => {
    const existingInvoice = invoicesByAppointmentId.get(appointment.id)
    const totalAmount = appointment.service?.price ? appointment.service.price / 100 : 0

    setSelectedCheckout(appointment)
    setPaymentStatus(existingInvoice?.payment_status ?? PaymentStatus.PAID)
    setPaymentMethod(existingInvoice?.payment_method ?? PaymentMethod.SINPE_MOVIL)
    setPaymentReference(existingInvoice?.payment_reference ?? `SINPE-${appointment.id.slice(0, 8)}`)
    setPaidAmountInput(
      existingInvoice?.paid_amount != null
        ? String(existingInvoice.paid_amount)
        : totalAmount > 0
          ? String(totalAmount)
          : "",
    )
    setCheckoutNotes(existingInvoice?.notes ?? "Cobro manual registrado desde recepción.")
    setCheckoutOpen(true)
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
    setSelectedCheckout(null)
    setPaymentStatus(PaymentStatus.PAID)
    setPaymentMethod(PaymentMethod.SINPE_MOVIL)
    setPaymentReference("")
    setPaidAmountInput("")
    setCheckoutNotes("")
  }

  const handleCloseCheckout = async (appointment: Appointment) => {
    if (!appointment.service?.price || appointment.service.price <= 0) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar el cobro",
        description: "El servicio no tiene un precio configurado.",
      })
      return
    }

    const existingInvoice = invoicesByAppointmentId.get(appointment.id)
    const totalAmount = appointment.service.price / 100
    const paidAmount = paymentStatus === PaymentStatus.UNPAID ? undefined : Number(paidAmountInput)
    const payload = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      total_amount: totalAmount,
      service_description: appointment.reason ?? appointment.service.name,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_reference: paymentReference || undefined,
      paid_amount: paidAmount,
      notes: checkoutNotes || undefined,
    }
    const createPayload = {
      ...payload,
      ...(paymentStatus !== PaymentStatus.UNPAID ? { paid_at: new Date().toISOString() } : {}),
    }
    const updatePayload = {
      ...payload,
      paid_at: paymentStatus === PaymentStatus.UNPAID ? null : new Date().toISOString(),
    }

    try {
      setClosingId(appointment.id)
      const invoice = existingInvoice
        ? await updateInvoice(existingInvoice.id, updatePayload)
        : await createInvoice(createPayload)
      setInvoices((prev) => {
        const next = prev.filter((item) => item.id !== invoice.id)
        return [invoice, ...next]
      })
      closeCheckout()
      toast({
        title: "Cobro registrado",
        description: `Se marcó la cita de ${appointment.patient.first_name} ${appointment.patient.last_name} como pagada por SINPE Móvil.`,
      })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar el cobro",
        description: err instanceof Error ? err.message : "Error desconocido",
      })
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-md bg-transparent">
      {/* Top strip */}
      {billingWarning && (
        <div className="flex items-start gap-3 rounded-md border border-warning bg-warning-bg px-4 py-3 text-warning ">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Cobros manuales no disponibles</p>
            <p className="text-xs">{billingWarning}</p>
          </div>
        </div>
      )}

      <div className="metric-strip metrics-three">
        {[
          { label: "En espera", value: appointments.filter(a => a.status === AppointmentStatus.WAITING).length },
          { label: "Completadas", value: completed.length },
          { label: "Pendientes de cierre", value: pendingClosures.length },
        ].map(stat => <div key={stat.label}><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "…" : stat.value}</p></div>)}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Today's Queue */}
        <div className="citabox-panel flex flex-col p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {selectedDate === getClinicTodayKey() ? "Agenda de hoy" : `Agenda del ${formatDateLabel(selectedDate)}`}
            </h3>
            <div className="flex items-center gap-2">
              <button
                aria-label="Día anterior" onClick={() => shiftDate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card transition-all hover:bg-[var(--ds-action-soft)]"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                aria-label="Fecha de la agenda" type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="rounded-md border border-input bg-[var(--ds-surface-alt)] px-2 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                aria-label="Día siguiente" onClick={() => shiftDate(1)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card transition-all hover:bg-[var(--ds-action-soft)]"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setSelectedDate(getClinicTodayKey())}
                className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition-all hover:bg-[var(--ds-action-soft)]"
              >
                Hoy
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando citas...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 py-8 justify-center text-danger">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
              <button onClick={load} className="text-sm font-semibold underline ml-2">Reintentar</button>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No hay citas para {formatDateLabel(selectedDate).toLowerCase()}.</p>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {appointments.map((apt) => {
                const name = `${apt.patient.first_name} ${apt.patient.last_name}`
                const initials = getInitials(apt.patient.first_name, apt.patient.last_name)
                const color = getAvatarColor(name)
                const isMutating = mutatingId === apt.id

                return (
                  <div key={apt.id} className="flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-[var(--ds-surface-alt)]">
                    <div
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-xs font-semibold text-primary-foreground transition-all hover:opacity-80"
                      style={{ backgroundColor: color }}
                      onClick={() => onOpenEMR(apt.patient_id)}
                      title="Abrir expediente" role="button" tabIndex={0} aria-label={`Abrir expediente de ${name}`} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenEMR(apt.patient_id) } }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(apt.start_time)} — {apt.reason ?? apt.service?.name ?? "Cita"}
                      </p>
                    </div>
                    <div className="relative">
                      {isMutating && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 size={14} className="animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <select
                        aria-label={`Estado de la cita de ${name}`} value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                        disabled={isMutating}
                        className={`cursor-pointer rounded-md border-0 px-3 py-1.5 text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-ring/40 ${isMutating ? "opacity-30" : ""} ${statusColors[apt.status] || "text-muted-foreground bg-muted"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: Actions + Pending Checkouts */}
        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="citabox-panel p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Acciones rápidas</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={onNewAppointment}
                className="citabox-action flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-95"
              >
                <CalendarPlus size={16} />
                Nueva cita
              </button>
              <button
                onClick={onWalkIn}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-[var(--ds-action)] py-3 text-sm font-semibold text-[var(--ds-action)] transition-all hover:bg-[var(--ds-action)] hover:text-primary-foreground"
              >
                <UserPlus size={16} />
                Paciente sin cita
              </button>
            </div>
          </div>

          {/* Pending Checkouts */}
          <div className="citabox-panel flex-1 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pendientes de cierre</h3>
            {pendingClosures.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No hay cierres pendientes.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingClosures.map((apt) => {
                  const invoice = invoicesByAppointmentId.get(apt.id)
                  const isClosing = closingId === apt.id
                  return (
                  <div key={apt.id} className="flex items-center justify-between rounded-md border-b border-border px-2 py-2 last:border-0 hover:bg-[var(--ds-surface-alt)]">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{apt.reason ?? apt.service?.name ?? "Cita"}</p>
                      {invoice && (
                        <p className="text-xs text-muted-foreground">
                          Estado actual: {invoice.payment_status === PaymentStatus.PARTIAL ? "Pago parcial" : "Pendiente"}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openCheckout(apt)}
                      disabled={isClosing}
                      className="rounded-md bg-[var(--ds-action)] px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-all hover:bg-[var(--ds-action-hover)] disabled:opacity-50"
                    >
                      {isClosing ? "Registrando..." : invoice ? "Editar cobro" : "Registrar cobro"}
                    </button>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={(next) => !next && closeCheckout()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar cobro manual</DialogTitle>
            <DialogDescription>
              {selectedCheckout
                ? `Gestiona el cobro de ${selectedCheckout.patient.first_name} ${selectedCheckout.patient.last_name}.`
                : "Gestiona el cobro de la cita seleccionada."}
            </DialogDescription>
          </DialogHeader>

          {selectedCheckout && (
            <div className="grid gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-semibold text-foreground">
                  {selectedCheckout.reason ?? selectedCheckout.service?.name ?? "Cita"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTime(selectedCheckout.start_time)} • Total esperado {formatMoney((selectedCheckout.service?.price ?? 0) / 100)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Estado de pago</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={PaymentStatus.UNPAID}>Pendiente</option>
                    <option value={PaymentStatus.PARTIAL}>Parcial</option>
                    <option value={PaymentStatus.PAID}>Pagado</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Método</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={PaymentMethod.SINPE_MOVIL}>SINPE Móvil</option>
                    <option value={PaymentMethod.TARJETA}>Tarjeta</option>
                    <option value={PaymentMethod.EFECTIVO}>Efectivo</option>
                    <option value={PaymentMethod.TRANSFERENCIA}>Transferencia</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Referencia</span>
                  <input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="SINPE-12345678"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Monto abonado</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentStatus === PaymentStatus.UNPAID ? "" : paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    disabled={paymentStatus === PaymentStatus.UNPAID}
                    placeholder={paymentStatus === PaymentStatus.PAID && selectedCheckout.service?.price ? String(selectedCheckout.service.price / 100) : "0.00"}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-foreground">Notas</span>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={closeCheckout}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => selectedCheckout && void handleCloseCheckout(selectedCheckout)}
              disabled={closingId === selectedCheckout?.id}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {closingId === selectedCheckout?.id ? "Guardando..." : "Guardar cobro"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
