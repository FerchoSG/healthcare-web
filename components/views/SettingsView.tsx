"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Trash2 } from "lucide-react"

const INITIAL_STAFF = [
  { id: "u1", name: "Dr. Carlos Mendez", email: "carlos@dentcare.cr", role: "Doctor", status: "Active" },
  { id: "u2", name: "Dr. Laura Martinez", email: "laura@dentcare.cr", role: "Doctor", status: "Active" },
  { id: "u3", name: "Ana Rodríguez", email: "ana@dentcare.cr", role: "Receptionist", status: "Active" },
  { id: "u4", name: "Admin User", email: "admin@dentcare.cr", role: "Admin", status: "Active" },
]

export function SettingsView() {
  const [clinic, setClinic] = useState({
    name: "DentCare Pro Clinic",
    taxId: "3-101-000000",
    phone: "+506 2222-3333",
    address: "San José, Costa Rica",
    email: "info@dentcare.cr",
  })
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "Doctor" })
  const [saved, setSaved] = useState(false)

  const handleSaveClinic = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) return
    setStaff((prev) => [...prev, { id: `u${Date.now()}`, ...inviteForm, status: "Pending" }])
    setInviteForm({ name: "", email: "", role: "Doctor" })
    setShowInvite(false)
  }

  const removeStaff = (id: string) => setStaff((prev) => prev.filter((s) => s.id !== id))

  const set = (k: keyof typeof clinic) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setClinic((prev) => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full overflow-y-auto">
      <div className="bg-white rounded-lg shadow-md border border-border overflow-hidden flex-1">
        <div className="px-6 pt-6 pb-0 border-b border-border">
          <h2 className="text-base font-bold text-foreground mb-4">Settings</h2>
          <Tabs defaultValue="clinic">
            <TabsList className="mb-0 bg-transparent border-b-0 p-0 gap-1">
              <TabsTrigger
                value="clinic"
                className="rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all"
              >
                Clinic Profile
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all"
              >
                Staff Management
              </TabsTrigger>
            </TabsList>

            {/* ── Clinic Profile ── */}
            <TabsContent value="clinic" className="p-4 sm:p-6 mt-0">
              <div className="max-w-lg flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Clinic Name</label>
                    <input
                      type="text"
                      value={clinic.name}
                      onChange={set("name")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Tax ID (Hacienda CR)</label>
                    <input
                      type="text"
                      value={clinic.taxId}
                      onChange={set("taxId")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Phone</label>
                    <input
                      type="tel"
                      value={clinic.phone}
                      onChange={set("phone")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Email</label>
                    <input
                      type="email"
                      value={clinic.email}
                      onChange={set("email")}
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Address</label>
                  <input
                    type="text"
                    value={clinic.address}
                    onChange={set("address")}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  />
                </div>

                <button
                  onClick={handleSaveClinic}
                  className="w-fit px-6 py-2.5 rounded-md text-sm font-semibold transition-all text-white"
                  style={{ backgroundColor: saved ? "var(--neon-green)" : "var(--foreground)", color: saved ? "white" : "var(--background)" }}
                >
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </TabsContent>

            {/* ── Staff Management ── */}
            <TabsContent value="staff" className="p-4 sm:p-6 mt-0">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-muted-foreground">{staff.length} team members</p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus size={13} />
                  Invite Staff
                </button>
              </div>

              {/* Invite form */}
              {showInvite && (
                <div className="bg-muted/60 rounded-lg p-4 mb-5 border border-border">
                  <p className="text-xs font-bold text-foreground mb-3">Invite New Staff Member</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                      className="px-3 py-2 rounded-md bg-white shadow-sm text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      <option>Doctor</option>
                      <option>Receptionist</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowInvite(false)} className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-xs font-semibold border border-border hover:text-foreground transition-all shadow-sm">
                      Cancel
                    </button>
                    <button onClick={handleInvite} className="px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all">
                      Send Invitation
                    </button>
                  </div>
                </div>
              )}

              {/* Staff table */}
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Name", "Email", "Role", "Status", ""].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-all">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: "#3ECF62" }}
                            >
                              {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                            <span className="text-xs font-semibold text-foreground">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{member.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                              member.status === "Active"
                                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                                : "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => removeStaff(member.id)}
                            className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
