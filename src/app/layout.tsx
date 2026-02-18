import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import { SkipLink } from '@/components/ui'

export const metadata: Metadata = {
  title: 'NCD-Care+ | Clinical Decision Support',
  description: 'Hospital-grade NCD risk prediction and clinical decision support platform based on NCD-CIE causal knowledge graph',
  keywords: ['NCD', 'clinical decision support', 'risk assessment', 'cardiovascular', 'diabetes', 'healthcare'],
  authors: [{ name: 'NCD-Care+ Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <SkipLink href="#main-content">Skip to main content</SkipLink>

        <div className="flex min-h-screen">
          <Navigation />

          <main
            id="main-content"
            className="flex-1 min-h-screen lg:pt-0 pt-14"
            role="main"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
