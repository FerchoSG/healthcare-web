"use client"
import { useState } from 'react'
import { Activity, CalendarDays, FileText, Users, Eye, EyeOff, Loader2 } from 'lucide-react'
import { api, setAccessToken, setClinicId } from '@/lib/api-client'
import { BRAND_NAME } from '@/lib/brand'
import { meToAuthUser, type AuthUser } from '@/lib/store'
import type { ClinicMembershipInfo, LoginResponse, MeResponse } from '@/types/api'
import { Button } from '@/components/ui/button'

export function AuthScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memberships, setMemberships] = useState<ClinicMembershipInfo[] | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  async function selectClinic(id: string) {
    setLoading(true); setError(null)
    try { setClinicId(id); onLogin(meToAuthUser(await api.get<MeResponse>('/auth/me'))) }
    catch { setError('No se pudo abrir la clínica. Intenta de nuevo.') }
    finally { setLoading(false) }
  }
  async function login(event: React.FormEvent) {
    event.preventDefault(); setError(null); setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email: email.trim(), password }, { skipAuth: true })
      setAccessToken(res.access_token)
      if (!res.memberships.length) { setError('Tu cuenta no tiene una clínica activa. Contacta al administrador.'); return }
      if (res.memberships.length > 1) setMemberships(res.memberships)
      else await selectClinic(res.memberships[0].clinic_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(/credentials|unauthorized/i.test(message) ? 'El correo o la contraseña no son correctos.' : 'No se pudo ingresar. Revisa tu conexión e intenta de nuevo.')
    } finally { setLoading(false) }
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-border bg-accent px-12 py-10 lg:flex">
        <div className="flex items-center gap-3 text-primary"><Activity size={26} /><span className="text-xl font-semibold">{BRAND_NAME}</span></div>
        <div className="mx-auto w-full max-w-md">
          <p className="mb-4 text-sm font-medium text-primary">Gestión clínica para Costa Rica</p>
          <h2 className="text-4xl font-semibold leading-tight text-foreground">Tu clínica,<br />en orden.</h2>
          <p className="mt-5 max-w-sm text-base text-muted-foreground">La agenda del día, la información de tus pacientes y cada consulta en un mismo lugar.</p>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {[{ Icon: CalendarDays, name: 'Agenda', text: 'Citas y atención por profesional' }, { Icon: Users, name: 'Pacientes', text: 'Información e historial a mano' }, { Icon: FileText, name: 'Expedientes', text: 'Continuidad para cada consulta' }].map(({ Icon, name, text }) => <div key={name} className="flex items-center gap-4 py-5"><Icon className="text-primary" size={22} /><div><p className="font-medium">{name}</p><p className="text-sm text-muted-foreground">{text}</p></div></div>)}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Un espacio de trabajo para tu equipo y tu clínica.</p>
      </section>
      <section className="flex items-center justify-center bg-card px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 text-primary lg:hidden"><Activity /><span className="text-xl font-semibold">{BRAND_NAME}</span></div>
          <p className="mb-2 text-sm font-medium text-primary">Acceso del personal</p>
          <h1 className="text-2xl font-semibold">{memberships ? 'Elige tu clínica' : 'Bienvenido de nuevo'}</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">{memberships ? 'Selecciona el espacio donde vas a trabajar.' : 'Ingresa con la cuenta de tu equipo clínico.'}</p>
          {error && <p role="alert" className="mb-5 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>}
          {memberships ? <div className="space-y-3">{memberships.map(m => <Button key={m.clinic_id} variant="outline" className="h-auto w-full justify-between py-4" disabled={loading} onClick={() => selectClinic(m.clinic_id)}>{m.clinic_name}{loading && <Loader2 className="animate-spin" />}</Button>)}</div> : <form onSubmit={login} className="space-y-5">
            <div><label htmlFor="staff-email" className="mb-2 block text-sm font-medium">Correo electrónico</label><input id="staff-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm" /></div>
            <div><label htmlFor="staff-password" className="mb-2 block text-sm font-medium">Contraseña</label><div className="relative"><input id="staff-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 pr-12 text-sm" /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <Button className="h-11 w-full" type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{loading ? 'Ingresando…' : 'Ingresar'}</Button>
          </form>}
          <p className="mt-6 text-sm text-muted-foreground">Si necesitas acceso, solicítalo al administrador de tu clínica.</p>
          <div className="mt-8 border-t border-border pt-6"><p className="text-sm text-muted-foreground">¿Buscas tus citas o indicaciones?</p><a href="/portal" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">Ir al portal del paciente</a></div>
        </div>
      </section>
    </main>
  )
}
