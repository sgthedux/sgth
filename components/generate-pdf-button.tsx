"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GeneratePdfButtonProps {
  userId: string
}

export function GeneratePdfButton({ userId }: GeneratePdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleGeneratePdf = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      // Llamar a la API para generar el PDF
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar el PDF")
      }

      // Obtener el blob del PDF
      const blob = await response.blob()

      // Crear una URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace temporal para descargar el archivo
      const a = document.createElement("a")
      a.href = url
      a.download = `hoja_de_vida_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(true)
    } catch (err: any) {
      console.error("Error al generar PDF:", err)
      setError(err.message || "Error al generar el PDF")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleGeneratePdf} disabled={isLoading} className="flex items-center gap-2">
        <FileDown className="h-4 w-4" />
        {isLoading ? "Generando..." : "Descargar Formato Único de Hoja de Vida"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>PDF generado y descargado correctamente.</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Descarga el formato con tus datos prellenados. Luego deberás firmarlo y subirlo en la sección de documentos.
      </p>
    </div>
  )
}
