"use client"

import { Activity, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { BRAND_NAME } from "@/lib/brand"

export default function PatientPortalIndexPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#008BB0]">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{BRAND_NAME}</p>
              <p className="text-xs text-slate-500">Portal del paciente</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            El acceso al portal depende de la clínica.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Para ingresar, usa el enlace público de tu clínica. Ese enlace incluye el slug de la clínica y dirige al acceso correcto del paciente.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-[#008BB0]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Formato esperado</p>
                <p className="mt-1 text-sm text-slate-600">
                  `/portal/nombre-de-tu-clinica`
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Ejemplo: `/portal/clinica-integral-san-carlos`
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ir a reservas en línea
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
