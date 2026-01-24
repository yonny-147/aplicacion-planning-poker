import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'

import { Manrope as V0_Font_Manrope, Space_Mono as V0_Font_Space_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'
import { Toaster } from 'sonner'

// Initialize fonts
const _manrope = V0_Font_Manrope({ subsets: ['latin'], weight: ["200", "300", "400", "500", "600", "700", "800"], variable: '--v0-font-manrope' })
const _spaceMono = V0_Font_Space_Mono({ subsets: ['latin'], weight: ["400", "700"], variable: '--v0-font-space-mono' })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200", "300", "400", "500", "600", "700", "800", "900"], variable: '--v0-font-source-serif-4' })
const _v0_fontVariables = `${_manrope.variable} ${_spaceMono.variable} ${_sourceSerif_4.variable}`

export const metadata: Metadata = {
  title: 'Planning Poker',
  description: 'Planning Poker',
  generator: 'Next.js',
  icons: {
    icon: '/description.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${_v0_fontVariables}`}>
        {children}
        <Toaster position='top-center' richColors />
        <Analytics />
      </body>
    </html>
  )
}
