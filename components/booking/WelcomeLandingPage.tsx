"use client"
import { useEffect, useState } from 'react'
import { Activity, ArrowRight, Clock, MapPin, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClinicTypeLabel } from '@/lib/clinic-types'
import { getServices } from '@/services/booking.service'
import type { PublicClinic, ServiceSummary } from '@/types/api'
export function WelcomeLandingPage({ onBook, clinic }: { onBook: (serviceId?: string) => void; clinic?: PublicClinic | null }) {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!clinic) return
    if (!clinic.booking_enabled) { setServices([]); setLoading(false); return }
    let cancelled = false; setLoading(true); setError(false)
    getServices(clinic.id).then(data => { if (!cancelled) setServices(data) }).catch(() => { if (!cancelled) setError(true) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clinic?.id, clinic?.booking_enabled, retry])
  const name = clinic?.name ?? 'Tu clínica'
  const phone = clinic?.public_phone ?? clinic?.phone
  const price = (value: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value / 100)
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary"><Activity size={24} /></div><div><p className="text-base font-semibold">{name}</p><p className="text-sm text-muted-foreground">{getClinicTypeLabel(clinic?.clinic_type)}</p></div></div><a href={`/portal/${clinic?.slug ?? ''}`} className="text-sm font-medium text-primary underline underline-offset-4">Mi portal</a></div></header>
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <div className="mb-8"><p className="mb-2 text-sm font-medium text-primary">Reservas en línea</p><h1 className="text-3xl font-semibold tracking-tight">Reserva tu cita</h1><p className="mt-3 max-w-xl text-base text-muted-foreground">Elige el servicio que necesitas. Después podrás consultar los profesionales y horarios disponibles.</p></div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="services-title" className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border px-5 py-4"><h2 id="services-title" className="text-lg font-semibold">Servicios de {name}</h2></div>
          {clinic?.booking_enabled === false ? <p className="p-5 text-muted-foreground">Para reservar una cita, contacta directamente a la clínica.</p> : loading ? <p role="status" className="flex items-center gap-2 px-5 py-12 text-muted-foreground"><Loader2 className="animate-spin" size={18} />Cargando servicios…</p> : error ? <div className="p-5"><p role="alert" className="mb-4 text-danger">No se pudieron cargar los servicios.</p><Button variant="outline" onClick={() => setRetry(v => v + 1)}>Reintentar</Button></div> : services.length ? <div className="divide-y divide-border">{services.map(service => <button key={service.id} onClick={() => onBook(service.id)} className="group flex w-full items-start justify-between gap-4 px-5 py-5 text-left hover:bg-accent"><div><h3 className="text-base font-medium group-hover:text-primary">{service.name}</h3>{service.description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{service.description}</p>}<span className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Clock size={14} />{service.duration_minutes} min</span></div><div className="flex shrink-0 items-center gap-3"><span className="tabular-nums text-sm font-semibold">{price(service.price)}</span><ArrowRight size={18} className="text-primary" /></div></button>)}</div> : <p className="p-5 text-muted-foreground">No hay servicios disponibles para reservar. Contacta a la clínica.</p>}
        </section>
        <aside className="space-y-6 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0"><div><h2 className="text-base font-semibold">Tu clínica</h2><p className="mt-2 text-sm text-muted-foreground">{name}</p>{clinic?.address && <p className="mt-4 flex items-start gap-2 text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" />{clinic.address}</p>}{phone && <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="mt-3 flex items-center gap-2 text-sm text-primary underline underline-offset-4"><Phone size={16} />{phone}</a>}</div><div className="border-t border-border pt-5"><h3 className="text-sm font-semibold">¿Ya tienes una cuenta?</h3><p className="mt-2 text-sm text-muted-foreground">Revisa tus citas e indicaciones en el portal del paciente.</p><a href={`/portal/${clinic?.slug ?? ''}`} className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">Entrar al portal</a></div></aside>
      </div>
    </main><footer className="mx-auto max-w-5xl border-t border-border px-5 py-6 text-xs text-muted-foreground">{name} · Reservas gestionadas con CitaBox</footer>
  </div>
}
