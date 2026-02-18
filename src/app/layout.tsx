import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'NCD-Care+ | Clinical Decision Support',
  description: 'Hospital-grade NCD risk prediction and clinical decision support platform based on NCD-CIE causal knowledge graph',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 min-h-screen lg:pt-0 pt-14">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
