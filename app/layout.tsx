import type { Metadata, Viewport } from "next"
import { Figtree, Newsreader } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree", display: "swap" })
const newsreader = Newsreader({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" })

export const metadata: Metadata = {
  title: "Shift Up: interview practice in your language",
  description: "Practice English job interviews for hourly work, with coaching in Spanish on what you say and how you say it.",
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f5e5a" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
