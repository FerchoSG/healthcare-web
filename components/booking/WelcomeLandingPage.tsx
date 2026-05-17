"use client"

import {
  Activity,
  ArrowRight,
  Calendar,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { getClinicTypeLabel } from "@/lib/clinic-types"
import { BRAND_NAME } from "@/lib/brand"
import type { PublicClinic } from "@/types/api"

const DEFAULT_SERVICES = [
  {
    title: "Consulta general",
    desc: "Valoracion medica, seguimiento y control clinico con una agenda simple para el paciente.",
  },
  {
    title: "Control preventivo",
    desc: "Chequeos y revisiones para mantener continuidad en la atencion y detectar riesgos a tiempo.",
  },
  {
    title: "Plan de tratamiento",
    desc: "Seguimiento estructurado con proximas citas, indicaciones y continuidad del expediente.",
  },
]

const DENTAL_SERVICES = [
  {
    title: "Evaluacion dental",
    desc: "Consulta inicial, diagnostico y definicion del tratamiento segun la necesidad del paciente.",
  },
  {
    title: "Restauracion y control",
    desc: "Atencion de caries, coronas, limpiezas y seguimiento de procedimientos frecuentes.",
  },
  {
    title: "Tratamiento planificado",
    desc: "Coordinacion de varias citas con tiempos claros y comunicacion directa con la clinica.",
  },
]

interface WelcomeLandingPageProps {
  onBook: () => void
  clinic?: PublicClinic | null
}

export function WelcomeLandingPage({ onBook, clinic }: WelcomeLandingPageProps) {
  const isDental = clinic?.clinic_type === "DENTAL"
  const services = isDental ? DENTAL_SERVICES : DEFAULT_SERVICES
  const clinicName = clinic?.name ?? BRAND_NAME
  const clinicTypeLabel = getClinicTypeLabel(clinic?.clinic_type).toLowerCase()
  const contactPhone = clinic?.public_phone ?? clinic?.phone ?? "+506 0000-0000"
  const address = clinic?.address ?? "Costa Rica"

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfc_0%,#ffffff_32%,#f2f7f8_100%)] text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#008BB0] shadow-sm">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">{clinicName}</p>
              <p className="text-[11px] text-slate-500">{clinicTypeLabel}</p>
            </div>
          </div>

          <button
            onClick={onBook}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Agendar cita
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,139,176,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(62,207,98,0.12),transparent_26%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <ShieldCheck size={13} className="text-[#008BB0]" />
              Booking directo con la clinica
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Agenda tu cita con una experiencia clara, rapida y hecha para Costa Rica.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              {clinicName} usa {BRAND_NAME} para ordenar la agenda, reducir llamadas y darle al paciente una ruta simple para reservar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onBook}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#008BB0] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00779a]"
              >
                <Calendar size={16} />
                Reservar ahora
              </button>
              <a
                href="#servicios"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Ver servicios
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Disponibilidad</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock3 size={15} />
                    <span className="text-xs font-semibold">Horarios</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">
                    Selecciona fecha y hora disponibles sin llamadas ni esperas.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone size={15} />
                    <span className="text-xs font-semibold">Contacto</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{contactPhone}</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin size={15} />
                    <span className="text-xs font-semibold">Ubicacion</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{address}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Citas claras", icon: Calendar },
                { label: "Seguimiento", icon: Stethoscope },
                { label: "Confirmacion rapida", icon: ShieldCheck },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                  <Icon size={16} className="mx-auto text-[#008BB0]" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#008BB0]">Servicios</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              Atencion organizada alrededor de la agenda del paciente.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            El flujo publico de {BRAND_NAME} esta pensado para que la clinica reciba mejores datos y el paciente entienda rapido como reservar.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#008BB0]/10 text-[#008BB0]">
                <Stethoscope size={18} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#008BB0]">Siguiente paso</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                Reserva en minutos y deja la información lista para la clínica.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                La reserva registra los datos base del paciente y prepara el flujo para recepción, doctor y expediente.
              </p>
            </div>

            <button
              onClick={onBook}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Empezar reserva
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
