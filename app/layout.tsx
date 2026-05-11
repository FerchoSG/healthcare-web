import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'CitaBox — Healthcare SaaS Platform',
  description: 'CitaBox – The all-in-one clinic management platform. Book appointments, manage records, and streamline billing at citabox.app.',
  generator: 'citabox.app',
  openGraph: {
    title: 'CitaBox — Healthcare SaaS Platform',
    description: 'CitaBox – The all-in-one clinic management platform.',
    siteName: 'CitaBox',
    url: 'https://citabox.app',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
