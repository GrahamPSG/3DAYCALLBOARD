import type { Metadata } from "next"
import "./globals.css"
import QueryProvider from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: "3-Day Minimum Call Board | Paris Service Group",
  description: "Real-time call board tracking for HVAC and Plumbing teams at Paris Service Group",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
