import type { Metadata } from 'next'
import { Syne, Inter, JetBrains_Mono } from 'next/font/google'
import Navbar from '@/components/shared/Navbar'
import './globals.css'

const syne = Syne({ variable: '--font-syne', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SourceAsia — Flight Booking',
  description:
    'Search, compare, and book domestic flights across India with SourceAsia. Best fares guaranteed.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
      </body>
    </html>
  )
}
