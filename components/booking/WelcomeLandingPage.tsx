"use client";

import {
  Smile,
  ArrowRight,
  Play,
  MapPin,
  Phone,
  Mail,
  Star,
  ChevronLeft,
  ChevronRight,
  Crown,
  Sparkles,
  ShieldCheck,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";

/* ─── Data ────────────────────────────────────────────────────────────── */

const SERVICES = [
  {
    title: "Implantes Dentales",
    desc: "Ofrecemos implantes duraderos y de apariencia natural que restauran la fuerza y belleza de tu sonrisa.",
  },
  {
    title: "Coronas Dentales",
    desc: "Nuestras coronas se integran perfectamente con tus dientes naturales, asegurando una sonrisa impecable.",
  },
  {
    title: "Cuidado de Caries",
    desc: "Tratamiento experto de caries, preservando y restaurando tu salud bucal de manera efectiva.",
  },
];

const DOCTORS = [
  { name: "Dr. Alexander Whitman", role: "Jefe, DDS, MS", initials: "AW", color: "bg-sky-100" },
  { name: "Dra. Olivia Harrington", role: "DMD, PhD", initials: "OH", color: "bg-rose-100" },
  { name: "Dr. Benjamin Hayes", role: "DMD, MSc", initials: "BH", color: "bg-emerald-100" },
  { name: "Dra. Sophia Chang", role: "DDS, MDS", initials: "SC", color: "bg-violet-100" },
  { name: "Dr. Nathaniel Carter", role: "DMD, MBioEth", initials: "NC", color: "bg-amber-100" },
];

const TESTIMONIALS = [
  {
    name: "Andrea Rojas",
    text: "Las instalaciones modernas y los equipos de primera me hicieron sentir que estaba en las mejores manos. Totalmente recomendado.",
    initials: "AR",
    color: "bg-sky-100",
  },
  {
    name: "Carlos Mora",
    text: "La genuina preocupación del equipo por mi bienestar y su compromiso con la excelencia los hace destacar entre todos.",
    initials: "CM",
    color: "bg-emerald-100",
  },
];

/* ─── Component ───────────────────────────────────────────────────────── */

interface WelcomeLandingPageProps {
  onBook: () => void;
}

export function WelcomeLandingPage({ onBook }: WelcomeLandingPageProps) {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-800">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#008BB0] flex items-center justify-center">
              <Smile size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Clínica DRC
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-[#008BB0] font-semibold">
              Inicio
            </a>
            <a href="#nosotros" className="text-slate-500 hover:text-slate-900 transition-colors">
              Nosotros
            </a>
            <a href="#servicios" className="text-slate-500 hover:text-slate-900 transition-colors">
              Servicios
            </a>
            <a href="#equipo" className="text-slate-500 hover:text-slate-900 transition-colors">
              Equipo
            </a>
            <a href="#contacto" className="text-slate-500 hover:text-slate-900 transition-colors">
              Contacto
            </a>
          </div>

          {/* CTA */}
          <button
            onClick={onBook}
            className="px-5 py-2.5 bg-[#008BB0] text-white text-sm font-semibold hover:bg-[#007199] transition-all active:scale-95 shadow-sm"
          >
            Agendar Cita
          </button>
        </div>
      </nav>

      {/* ── Section 1 : Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Soft gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40 -z-10" />

        <div className="max-w-[1200px] mx-auto px-6 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-6 items-center">
            {/* Left copy */}
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.12] tracking-tight text-slate-900 mb-6">
                Sonríe con{" "}
                <span className="text-[#008BB0]">Confianza,</span>
                <br />
                Vive{" "}
                <span className="text-[#008BB0]">Radiante.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-10 max-w-md">
                Creemos que cada sonrisa cuenta una historia. Nuestra misión es ayudarte a escribir la tuya con confianza y salud.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={onBook}
                  className="px-7 py-3.5 bg-[#008BB0] text-white text-[15px] font-semibold hover:bg-[#007199] transition-all active:scale-[.97] shadow-sm"
                >
                  Agendar Cita
                </button>
                <a
                  href="#nosotros"
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-[#008BB0] transition-colors">
                    <Play size={14} className="text-slate-500 group-hover:text-[#008BB0] ml-0.5" />
                  </span>
                  Conocer más
                </a>
              </div>
            </div>

            {/* Right image placeholder */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-md aspect-[4/5] overflow-hidden shadow-lg">
                <img src="clinica-06.jpg" alt="Clínica DRC" className="w-full h-full object-cover" />
              </div>
              {/* Decorative dot */}
              <div className="absolute -bottom-4 -left-4 w-20 h-20  bg-[#008BB0]/10 blur-xl hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2 : Experience Excellence ──────────────────────────── */}
      <section id="nosotros" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-md">
              Excelencia en<br />
              Odontología
            </h2>
            <p className="text-slate-500 leading-relaxed max-w-sm text-[15px]">
              Desde cuidado preventivo hasta tratamientos avanzados, nos esforzamos por superar tus expectativas y dejarte sonriendo de oreja a oreja.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onBook}
              className="px-6 py-3 rounded-md border-2 border-slate-900 text-slate-900 text-sm font-semibold hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              Servicios
            </button>
          </div>

          {/* Image collage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 aspect-[4/3] flex items-center justify-center overflow-hidden shadow-md">
              {/* <div className="text-center p-6">
                <div className="w-16 h-16 bg-white/80 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Sparkles size={28} className="text-[#008BB0]" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Instalaciones Modernas</p>
              </div> */}
              <img src="clinica-05.jpg" alt="Instalaciones Modernas" />
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-sky-50 aspect-[4/3] flex items-center justify-center overflow-hidden shadow-md">
              {/* <div className="text-center p-6">
                <div className="w-16 h-16 bg-white/80 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <ShieldCheck size={28} className="text-[#008BB0]" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Atención Personalizada</p>
              </div> */}
              <img src="clinica-04.jpg" alt="Atención Personalizada" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 : Services (Left / Right) ───────────────────────── */}
      <section id="servicios" className="bg-slate-50/60">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            {/* Left */}
            <div className="lg:sticky lg:top-28">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
                Todos tus tratamientos en un solo lugar
              </h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-8 max-w-sm">
                Desde limpiezas de rutina hasta procedimientos avanzados como ortodoncia e implantes, nuestro equipo se dedica a brindarte un cuidado excepcional.
              </p>
              <button
                onClick={onBook}
                className="px-6 py-3 rounded-md border-2 border-slate-900 text-slate-900 text-sm font-semibold hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                Ver Todos
              </button>
            </div>

            {/* Right: service cards */}
            <div className="flex flex-col gap-5">
              {SERVICES.map((svc) => (
                <div
                  key={svc.title}
                  className="bg-white p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                    {svc.title.includes("Implante") && <Crown size={22} className="text-[#008BB0]" />}
                    {svc.title.includes("Corona") && <Sparkles size={22} className="text-[#008BB0]" />}
                    {svc.title.includes("Caries") && <ShieldCheck size={22} className="text-[#008BB0]" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{svc.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{svc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 : Doctors ────────────────────────────────────────── */}
      <section id="equipo" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Conoce a Nuestros Especialistas
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[15px] leading-relaxed">
              Con años de experiencia y un compromiso con la excelencia, nuestro equipo combina experiencia con un trato humano.
            </p>
          </div>

          {/* Carousel nav hints */}
          <div className="flex justify-center gap-2 mb-10 mt-6">
            <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Doctor grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {DOCTORS.map((doc) => (
              <div key={doc.name} className="flex flex-col items-center text-center">
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full ${doc.color} flex items-center justify-center mb-4 text-2xl font-bold text-slate-500`}>
                  {doc.initials}
                </div>
                <p className="font-semibold text-sm text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{doc.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5 : Testimonials ───────────────────────────────────── */}
      <section className="bg-slate-50/60">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left header */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Lo que Dicen<br />
                Nuestros Pacientes
              </h2>
              <p className="text-slate-500 mt-4 text-[15px] leading-relaxed max-w-sm">
                Desde superar la ansiedad dental hasta lograr la sonrisa de sus sueños, nuestros pacientes comparten sus experiencias.
              </p>
              {/* Carousel nav */}
              <div className="flex gap-2 mt-8">
                <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Right testimonial cards */}
            <div className="flex flex-col sm:flex-row gap-5">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white p-6 shadow-md border border-slate-100 flex-1"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-sm font-bold text-slate-600`}>
                      {t.initials}
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {t.text}
                  </p>
                  <p className="font-bold text-sm text-slate-900">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6 : Blue CTA Banner ────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-24">
        <div
          className="max-w-[1200px] mx-auto relative overflow-hidden shadow-lg"
          style={{ backgroundImage: "url('clinica-06.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#008BB0]/80" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center">
            {/* Left text */}
            <div className="p-10 sm:p-14 lg:p-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-8">
                Agenda Tu Cita<br />
                Hoy Mismo
              </h2>
              <button
                onClick={onBook}
                className="px-7 py-3.5 bg-white text-[#008BB0] text-[15px] font-semibold hover:bg-slate-50 transition-all active:scale-[.97] shadow-sm"
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer id="contacto" className="bg-slate-900 text-slate-400">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#008BB0] flex items-center justify-center">
                  <Smile size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Clínica DRC</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 max-w-[220px]">
                Con bloques de atención personalizada, construimos sonrisas sin esfuerzo.
              </p>
              <div className="flex items-center gap-3">
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <Icon size={14} className="text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Compañía</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#equipo" className="hover:text-white transition-colors">Carrera</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prensa</a></li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Servicios</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#servicios" className="hover:text-white transition-colors">Tratamientos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Novedades</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Legal</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Devolución</a></li>
              </ul>
            </div>
          </div>

          {/* Contact row */}
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#008BB0] shrink-0" />
                San Carlos, Alajuela, Costa Rica
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-[#008BB0] shrink-0" />
                +506 2222-3344
              </span>
              <span className="flex items-center gap-2">
                <Mail size={14} className="text-[#008BB0] shrink-0" />
                info@clinicadrc.cr
              </span>
            </div>
            <p className="text-xs text-slate-500">
              © 2026 Clínica DRC. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}