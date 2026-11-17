import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Our Little Fund',
  description: 'Little by little, together. A shared savings app for couples.',
  keywords: ['savings', 'couple', 'finance', 'goals', 'shared', 'money'],
  authors: [{ name: 'Our Little Fund' }],
  creator: 'Our Little Fund',
  publisher: 'Our Little Fund',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Our Little Fund',
    description: 'Little by little, together. A shared savings app for couples.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Our Little Fund',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Little Fund',
    description: 'Little by little, together. A shared savings app for couples.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#FAF8F5',
}

export const viewport: Viewport = {
  themeColor: '#FAF8F5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${playfair.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-cream font-sans antialiased text-charcoal">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}