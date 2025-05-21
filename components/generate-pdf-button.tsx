"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface GeneratePdfButtonProps {
  userId: string
}

export function GeneratePdfButton({ userId }: GeneratePdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGeneratePdf = async () => {
    try {
      setLoading(true)
      console.log("Generando PDF para el usuario:", userId)

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

      // Verificar que la respuesta contiene datos
      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error("El PDF generado está vacío")
      }

      console.log("PDF generado correctamente, tamaño:", blob.size)

      // Crear URL para descargar el PDF
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hoja_de_vida_${new Date().getTime()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF generado correctamente",
        description: "Tu hoja de vida ha sido generada y descargada.",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error al generar PDF",
        description: error.message || "Ocurrió un error al generar el PDF",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGeneratePdf} disabled={loading} className="w-full sm:w-auto">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Generar y Descargar PDF
        </>
      )}
    </Button>
  )
}
