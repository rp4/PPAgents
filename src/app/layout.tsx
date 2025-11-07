import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layouts/Header"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import Link from "next/link"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "PPAgents - Internal AI Agent Repository",
    template: "%s | PPAgents"
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>',
  },
  description: "Internal platform for sharing platform-agnostic AI agents. Supporting OpenAI, Claude, Gemini, LangChain, and Copilot.",
  keywords: ["AI agents", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "internal tools"],
  authors: [{ name: process.env.NEXT_PUBLIC_COMPANY_NAME || "PPAgents" }],
  creator: process.env.NEXT_PUBLIC_COMPANY_NAME || "PPAgents",
  publisher: process.env.NEXT_PUBLIC_COMPANY_NAME || "PPAgents",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Agent Library - Internal AI Agent Repository',
    description: 'Internal platform for sharing platform-agnostic AI agents',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'PPAgents',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Agent Library Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Library - Internal AI Agent Repository',
    description: 'Internal platform for sharing platform-agnostic AI agents',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <QueryProvider>
              <Toaster position="top-right" richColors closeButton />
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <footer className="bg-muted mt-auto">
                <div className="container mx-auto px-4 py-8">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="font-semibold mb-2">Agent Library</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Internal platform for sharing AI agents
                    </p>
                  </div>
                </div>
              </footer>
            </QueryProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
