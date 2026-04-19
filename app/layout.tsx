import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

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
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
