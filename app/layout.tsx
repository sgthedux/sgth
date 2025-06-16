import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: {
    default: "SGTH - Sistema de Gestión de Talento Humano",
    template: "%s | SGTH"
  },
  description: "Plataforma para la gestión digital de hojas de vida de talento humano",
  keywords: ["SGTH", "talento humano", "hoja de vida", "gestión", "recursos humanos"],
  authors: [{ name: "Universidad Tecnológica del Distrito" }],
  creator: "Universidad Tecnológica del Distrito",
  publisher: "Universidad Tecnológica del Distrito",
  applicationName: "SGTH",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>SGTH - Sistema de Gestión de Talento Humano</title>
        <meta name="description" content="Plataforma para la gestión digital de hojas de vida de talento humano" />
        <meta name="application-name" content="SGTH" />
        <meta name="apple-mobile-web-app-title" content="SGTH" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            containerStyle={{
              bottom: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                maxWidth: '400px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid #10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid #ef4444',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid #3b82f6',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
