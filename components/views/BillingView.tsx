"use client"

import { useState } from "react"
import { INVOICES, type Invoice } from "@/lib/store"
import { FileText, CheckCircle, XCircle, Clock, DollarSign, MoreHorizontal, Pencil, CircleDollarSign } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PATIENTS } from "@/lib/store"

const haciendaConfig: Record<Invoice["haciendaStatus"], { label: string; className: string }> = {
  Accepted: { label: "Accepted", className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" },
  Rejected: { label: "Rejected", className: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300" },
  Draft: { label: "Draft", className: "text-muted-foreground bg-muted" },
  Pending: { label: "Pending", className: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300" },
}

const paymentConfig: Record<Invoice["paymentStatus"], { className: string }> = {
  Paid: { className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" },
  Unpaid: { className: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300" },
  Partial: { className: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300" },
}

interface BillingViewProps {
  onNewInvoice: () => void
}

export function BillingView({ onNewInvoice }: BillingViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES)
  const [filter, setFilter] = useState<"all" | Invoice["haciendaStatus"]>("all")
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const totalRevenue = invoices.filter((i) => i.paymentStatus === "Paid").reduce((acc, i) => acc + i.amount, 0)
  const unpaid = invoices.filter((i) => i.paymentStatus === "Unpaid").reduce((acc, i) => acc + i.amount, 0)
  const accepted = invoices.filter((i) => i.haciendaStatus === "Accepted").length
  const rejected = invoices.filter((i) => i.haciendaStatus === "Rejected").length

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.haciendaStatus === filter)

  const markAsPaid = (id: string) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, paymentStatus: "Paid" as const } : inv))
  }

  const saveEdit = (updated: Invoice) => {
    setInvoices((prev) => prev.map((inv) => inv.id === updated.id ? updated : inv))
    setEditingInvoice(null)
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={14} />, badge: true },
          { label: "Pending Payment", value: `$${unpaid.toLocaleString()}`, icon: <Clock size={14} /> },
          { label: "Hacienda Accepted", value: String(accepted), icon: <CheckCircle size={14} />, green: true },
          { label: "Hacienda Rejected", value: String(rejected), icon: <XCircle size={14} />, red: true },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-md p-4 border border-border flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                s.green ? "" : s.red ? "bg-red-50 dark:bg-red-950" : "bg-muted"
              }`}
              style={s.green ? { backgroundColor: "var(--neon-green-bg)" } : {}}
            >
              <span
                className={s.green ? "" : s.red ? "text-red-500" : "text-muted-foreground"}
                style={s.green ? { color: "var(--neon-green)" } : {}}
              >
                {s.icon}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-extrabold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow-md border border-border flex flex-col overflow-hidden flex-1">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground shrink-0">Invoices — Hacienda CR</h3>
          <div className="flex items-center gap-2 overflow-x-auto ml-4 no-scrollbar">
            {(["all", "Accepted", "Rejected", "Draft", "Pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                  filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
            <button
              onClick={onNewInvoice}
              className="ml-2 flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-foreground shadow-sm text-background text-xs font-semibold hover:opacity-90 transition-all whitespace-nowrap shrink-0"
            >
              <FileText size={12} />
              Create Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Invoice", "Patient", "Service", "Amount", "Date", "Hacienda", "Payment", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-muted-foreground px-4 lg:px-6 py-3 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border hover:bg-muted/40 transition-all">
                  <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                        <FileText size={12} className="text-muted-foreground" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 text-xs font-medium text-foreground whitespace-nowrap">{inv.patientName}</td>
                  <td className="px-4 lg:px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{inv.service}</td>
                  <td className="px-4 lg:px-6 py-3.5 text-xs font-bold text-foreground whitespace-nowrap">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 lg:px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{inv.date}</td>
                  <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${haciendaConfig[inv.haciendaStatus].className}`}>
                      {haciendaConfig[inv.haciendaStatus].label}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${paymentConfig[inv.paymentStatus].className}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-lg p-1.5">
                        <DropdownMenuItem
                          onClick={() => setEditingInvoice({ ...inv })}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
                        >
                          <Pencil size={13} />
                          Edit Invoice
                        </DropdownMenuItem>
                        {inv.paymentStatus !== "Paid" && (
                          <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => markAsPaid(inv.id)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer"
                              style={{ color: "var(--neon-green-text)" }}
                            >
                              <CircleDollarSign size={13} />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Dialog */}
      {editingInvoice && (
        <EditInvoiceDialog
          invoice={editingInvoice}
          onSave={saveEdit}
          onClose={() => setEditingInvoice(null)}
        />
      )}
    </div>
  )
}

// ─── Edit Invoice Dialog ───────────────────────────────────────────────────
function EditInvoiceDialog({
  invoice,
  onSave,
  onClose,
}: {
  invoice: Invoice
  onSave: (inv: Invoice) => void
  onClose: () => void
}) {
  const [form, setForm] = useState(invoice)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-lg max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">Edit Invoice — {invoice.id}</DialogTitle>
          <DialogDescription className="sr-only">Edit the invoice details including patient, service, amount, and payment status.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Patient</label>
            <select
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none"
            >
              {PATIENTS.map((p) => <option key={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Service</label>
            <input
              type="text"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Amount ($)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as Invoice["paymentStatus"] })}
                className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none"
              >
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Partial</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-md bg-muted shadow-sm text-muted-foreground text-sm font-semibold hover:text-foreground transition-all">
            Cancel
          </button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-md bg-foreground shadow-sm text-background text-sm font-semibold hover:opacity-90 transition-all">
            Save Changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
