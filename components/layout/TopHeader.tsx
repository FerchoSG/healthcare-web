"use client"
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Building2, ChevronDown, LogOut, Menu, Moon, Search, Sun, UserPlus, CalendarPlus, Settings } from 'lucide-react'
import type { AuthUser, Role, View } from '@/lib/store'
import type { Patient } from '@/types/api'
import { fetchPatients } from '@/services/patients.service'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface TopHeaderProps {
  role: Role; authUser: AuthUser; activeView: View
  onLogout: () => void; onNewAppointment: () => void; onNewPatient: () => void
  onViewChange: (view: View) => void; onMenuClick: () => void
  onClinicSwitch: (clinicId: string) => void; onOpenPatient: (patientId: string) => void
}
const titles: Record<View, string> = {
  dashboard: 'Hoy', calendar: 'Agenda', patients: 'Pacientes', settings: 'Configuración',
  'front-desk': 'Recepción', schedule: 'Mi agenda', 'medical-records': 'Expedientes', emr: 'Expediente',
}
export function TopHeader({ role, authUser, activeView, onLogout, onNewAppointment, onNewPatient, onViewChange, onMenuClick, onClinicSwitch, onOpenPatient }: TopHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    let cancelled = false
    setResults([]); setSearchError(false)
    if (query.trim().length < 2) { setSearchLoading(false); return }
    setSearchLoading(true)
    const timer = setTimeout(() => {
      fetchPatients({ search: query.trim(), limit: 5 }).then(res => { if (!cancelled) setResults(res.data) })
        .catch(() => { if (!cancelled) setSearchError(true) })
        .finally(() => { if (!cancelled) setSearchLoading(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, authUser.membership?.clinic_id])
  useEffect(() => { setQuery('') }, [authUser.membership?.clinic_id])
  const isDark = mounted && resolvedTheme === 'dark'
  return (
    <header className="relative z-20 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú" onClick={onMenuClick}><Menu /></Button>
        <h1 className="sr-only font-semibold sm:not-sr-only sm:text-lg">{titles[activeView]}</h1>
        <span className="hidden text-muted-foreground sm:block" aria-hidden="true">/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="min-w-0 max-w-40 px-2 sm:max-w-56" aria-label="Cambiar clínica">
              <Building2 className="text-primary" /><span className="truncate">{authUser.membership?.clinic_name ?? 'Clínica'}</span><ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {authUser.memberships.map(m => <DropdownMenuItem key={m.clinic_id} onClick={() => onClinicSwitch(m.clinic_id)} className={m.clinic_id === authUser.membership?.clinic_id ? 'bg-accent text-primary' : ''}>{m.clinic_name}{m.clinic_id === authUser.membership?.clinic_id ? ' · Activa' : ''}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
        <input aria-label="Buscar pacientes" placeholder="Buscar por nombre o identificación" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery('') }} className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm" />
        {query.trim().length >= 2 && <div className="absolute top-12 z-30 w-full rounded-lg border border-border bg-popover p-2 shadow-md" aria-live="polite">
          {searchLoading ? <p className="p-3 text-sm text-muted-foreground">Buscando…</p> : searchError ? <p className="p-3 text-sm text-danger">No se pudo buscar. Intenta de nuevo.</p> : results.length ? results.map(p => <button key={p.id} onClick={() => { setQuery(''); onOpenPatient(p.id) }} className="block w-full rounded-md px-3 py-2 text-left hover:bg-accent"><span className="block text-sm font-medium">{p.first_name} {p.last_name}</span><span className="text-xs text-muted-foreground">{p.identification}</span></button>) : <p className="p-3 text-sm text-muted-foreground">No se encontraron pacientes.</p>}
        </div>}
      </div>
      <div className="flex items-center gap-2">
        {role !== 'doctor' && <Button onClick={activeView === 'patients' ? onNewPatient : onNewAppointment} className="hidden sm:inline-flex">{activeView === 'patients' ? <UserPlus /> : <CalendarPlus />}{activeView === 'patients' ? 'Nuevo paciente' : 'Nueva cita'}</Button>}
        <Button variant="ghost" size="icon" aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={() => setTheme(isDark ? 'light' : 'dark')}>{isDark ? <Sun /> : <Moon />}</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" size="icon" aria-label="Menú de cuenta">{authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64"><div className="px-3 py-2"><p className="font-medium">{authUser.name}</p><p className="truncate text-xs text-muted-foreground">{authUser.email}</p></div><DropdownMenuSeparator />
            {role === 'admin' && <DropdownMenuItem onClick={() => onViewChange('settings')}><Settings />Configuración</DropdownMenuItem>}
            {role !== 'doctor' && <DropdownMenuItem onClick={onNewAppointment}><CalendarPlus />Nueva cita</DropdownMenuItem>}
            {role !== 'doctor' && <DropdownMenuItem onClick={onNewPatient}><UserPlus />Nuevo paciente</DropdownMenuItem>}
            <DropdownMenuItem onClick={onLogout} className="text-danger"><LogOut />Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
