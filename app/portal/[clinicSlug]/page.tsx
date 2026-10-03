"use client"
import { use, useEffect, useState } from 'react'
import { Activity, CalendarDays, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatClinicDateTime } from '@/lib/clinic-time'
import { appointmentStatusClass, appointmentStatusLabel } from '@/lib/design'
import { getPublicClinic } from '@/services/booking.service'
import type { AppointmentStatus, Prescription, PublicClinic } from '@/types/api'
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
type PatientProfile = { first_name: string; last_name: string; identification: string }
type PortalAppointment = { id: string; start_time: string; status: AppointmentStatus; doctor: { first_name: string; last_name: string } }
export default function ClinicPortalPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params)
  const [clinic, setClinic] = useState<PublicClinic | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [identification, setIdentification] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<PortalAppointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [clinicError, setClinicError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    setClinicError(false)
    getPublicClinic(clinicSlug).then(value => { if (!cancelled) setClinic(value) }).catch(() => { if (!cancelled) setClinicError(true) })
    return () => { cancelled = true }
  }, [clinicSlug, retry])
  async function login(event: React.FormEvent) {
    event.preventDefault()
    if (!clinic || loading) return
    setLoading(true); setError(null)
    try {
      const response = await fetch(`${BASE_URL}/portal/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identification: identification.trim(), password, clinic_id: clinic.id }) })
      if (!response.ok) throw new Error(response.status === 401 ? 'La identificación o la contraseña no son correctas.' : 'No se pudo ingresar. Intenta de nuevo.')
      const { access_token } = await response.json()
      const headers = { Authorization: `Bearer ${access_token}` }
      const results = await Promise.all(['/profile', '/appointments', '/prescriptions'].map(async path => {
        const result = await fetch(`${BASE_URL}/portal${path}`, { headers })
        if (!result.ok) throw new Error('No se pudieron cargar tus datos. Intenta ingresar de nuevo.')
        return result.json()
      }))
      setProfile(results[0]); setAppointments(results[1]); setPrescriptions(results[2]); setToken(access_token)
    } catch (err) { setError(err instanceof TypeError ? 'Revisa tu conexión e intenta de nuevo.' : err instanceof Error ? err.message : 'No se pudo ingresar.') }
    finally { setLoading(false) }
  }
  if (!clinic) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-sm text-center">{clinicError ? <><h1 className="text-xl font-semibold">No pudimos abrir tu clínica</h1><p className="my-4 text-sm text-muted-foreground">Revisa el enlace que te compartieron o intenta de nuevo.</p><Button onClick={() => setRetry(v => v + 1)}>Reintentar</Button></> : <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" />Cargando tu clínica…</p>}</div></main>
  if (!token || !profile) return <main className="flex min-h-screen items-center justify-center bg-background p-6"><section className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
    <Activity className="mb-5 text-primary" size={28} /><p className="text-sm font-medium text-primary">{clinic.name}</p><h1 className="mt-2 text-2xl font-semibold">Portal del paciente</h1><p className="mb-6 mt-3 text-sm text-muted-foreground">Consulta tus citas y las indicaciones de tu profesional.</p>
    {error && <p role="alert" className="mb-4 rounded-md bg-danger-bg p-3 text-sm text-danger">{error}</p>}
    <form onSubmit={login} className="space-y-4">
      <div><label htmlFor="patient-identification" className="mb-2 block text-sm font-medium">Identificación</label><Input id="patient-identification" autoComplete="username" required value={identification} onChange={e => setIdentification(e.target.value)} /></div>
      <div><label htmlFor="patient-password" className="mb-2 block text-sm font-medium">Contraseña</label><Input id="patient-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
      <Button disabled={loading} type="submit" className="w-full">{loading && <Loader2 className="animate-spin" />}{loading ? 'Ingresando…' : 'Ingresar'}</Button>
    </form><p className="mt-5 text-sm text-muted-foreground">Si necesitas ayuda con tu acceso, contacta a recepción.</p><Link href={`/book/${clinicSlug}`} className="mt-5 inline-block text-sm text-primary underline underline-offset-4">Reservar una cita</Link>
  </section></main>
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card px-6 py-4"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><span className="font-semibold">{clinic.name}</span><Button variant="outline" onClick={() => { setToken(null); setProfile(null); setAppointments([]); setPrescriptions([]); setPassword('') }}>Cerrar sesión</Button></div></header>
    <main className="mx-auto max-w-3xl space-y-6 p-6"><div><p className="text-sm text-muted-foreground">Portal del paciente</p><h1 className="mt-1 text-2xl font-semibold">Hola, {profile.first_name}</h1></div>
      <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Tus citas</h2><Link href={`/book/${clinicSlug}`} className={buttonVariants({ variant: 'outline' })}>Reservar cita</Link></div>
        <div className="divide-y divide-border">{appointments.map(appointment => <article key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="flex items-center gap-2 font-medium"><CalendarDays size={16} />{formatClinicDateTime(appointment.start_time)}</p><p className="mt-1 text-sm text-muted-foreground">{appointment.doctor.first_name} {appointment.doctor.last_name}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${appointmentStatusClass(appointment.status)}`}>{appointmentStatusLabel(appointment.status)}</span></article>)}</div>
        {!appointments.length && <p className="py-4 text-sm text-muted-foreground">Todavía no tienes citas registradas.</p>}
      </section>
      <section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-4 text-lg font-semibold">Indicaciones</h2><div className="divide-y divide-border">{prescriptions.map(prescription => <article key={prescription.id} className="py-4"><h3 className="font-medium">{prescription.medicalRecord?.diagnosis ?? 'Receta médica'}</h3><ul className="mt-3 space-y-2 text-sm">{prescription.medications.map((medication, index) => <li key={index}>{medication.name} · {medication.dosage} · {medication.frequency}</li>)}</ul><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{prescription.additional_notes ?? prescription.medicalRecord?.treatment_plan ?? 'Sin indicaciones adicionales'}</p></article>)}</div>{!prescriptions.length && <p className="py-4 text-sm text-muted-foreground">Todavía no tienes indicaciones registradas.</p>}</section>
    </main>
  </div>
}
