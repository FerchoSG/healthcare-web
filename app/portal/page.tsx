"use client"
import { Activity } from 'lucide-react'
import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'
import { buttonVariants } from '@/components/ui/button'
export default function PatientPortalIndexPage() {
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12"><section className="w-full max-w-lg rounded-lg border border-border bg-card p-6 sm:p-10">
    <div className="mb-8 flex items-center gap-3 text-primary"><Activity /><span className="font-semibold">{BRAND_NAME}</span></div><p className="mb-2 text-sm font-medium text-primary">Portal del paciente</p><h1 className="text-2xl font-semibold">Tus citas e indicaciones</h1>
    <p className="mt-4 text-base leading-relaxed text-muted-foreground">Ingresa desde el enlace que te compartió tu clínica. Allí podrás consultar tus citas y las indicaciones de tu profesional.</p>
    <div className="mt-6 border-l-4 border-primary bg-accent p-4"><h2 className="font-medium">¿No tienes el enlace?</h2><p className="mt-2 text-sm leading-relaxed">Solicítalo en recepción. Tu clínica también te ayudará a obtener tus datos de acceso.</p></div>
    <Link href="/" className={`${buttonVariants({ variant: 'outline' })} mt-8`}>Acceso del personal</Link>
  </section></main>
}
