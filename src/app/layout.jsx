import { Geist_Mono as GeistMono } from "next/font/google"
import "./globals.css"

const geistMono = GeistMono({ subsets: ["latin"] })

export const metadata = {
  title: "Data Analytics Tool - Cyberpunk Dashboard",
  description: "Advanced data cleaning and analytics platform",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistMono.className} bg-black text-white antialiased`}>{children}</body>
    </html>
  )
}
