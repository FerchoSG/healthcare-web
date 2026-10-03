import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { BRAND_DOMAIN, BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'
import './globals.css'

export const metadata: Metadata = {
  title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
  description: `${BRAND_NAME} ayuda a clinicas en Costa Rica a gestionar citas, pacientes, expedientes y portal del paciente desde una sola plataforma.`,
  generator: BRAND_DOMAIN,
  openGraph: {
    title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    description: `${BRAND_NAME} ayuda a clinicas en Costa Rica a gestionar citas, pacientes, expedientes y portal del paciente desde una sola plataforma.`,
    siteName: BRAND_NAME,
    url: `https://${BRAND_DOMAIN}`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
          storageKey="citabox-theme"
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
