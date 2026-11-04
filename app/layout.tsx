import "@/app/globals.css"
import { Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Toaster } from "@/components/layout/toaster"


const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })

export const metadata = {
  title: "Kans Resto - Restaurant POS",
  description: "Modern restaurant point of sale system",
    generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
