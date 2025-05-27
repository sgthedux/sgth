"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentUpload } from "@/components/profile/document-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"

interface LanguageFormProps {
  userId: string
  languages?: Array<{
    id: string
    language: string
    speaking_level: string
    reading_level: string
    writing_level: string
  }>
}

// Función de utilidad para esperar un tiempo determinado
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Función para reintentar una operación con backoff exponencial
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.log(`Intento ${attempt + 1} fallido:`, error)
      lastError = error

      // Esperar con backoff exponencial antes de reintentar
      const delay = initialDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  throw lastError
}

export function LanguageForm({ userId, languages = [] }: LanguageFormProps) {
  const router = useRouter()
  const [items, setItems] = useState<
    Array<{
      id: string
      language: string
      speaking_level: string
      reading_level: string
      writing_level: string
      isDeleting?: boolean
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Cargar los idiomas al iniciar
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoadingData(true)
        console.log("Cargando idiomas existentes para usuario:", userId)

        const response = await fetch(`/api/profile-data?type=languages&userId=${userId}`)
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const data = await response.json()
        console.log("Respuesta de idiomas:", data)

        if (data.success && data.data && data.data.length > 0) {
          setItems(
            data.data.map((lang: any) => ({
              id: lang.id || "",
              language: lang.language || "",
              speaking_level: lang.speaking_level || "",
              reading_level: lang.reading_level || "",
              writing_level: lang.writing_level || "",
            })),
          )
          console.log("Datos de idiomas cargados exitosamente:", data.data.length, "registros")
        } else {
          // Si no hay idiomas, inicializar con un elemento vacío
          setItems([
            {
              id: "",
              language: "",
              speaking_level: "",
              reading_level: "",
              writing_level: "",
            },
          ])
          console.log("No se encontraron idiomas existentes, formulario vacío")
        }
      } catch (error: any) {
        console.error("Error al cargar idiomas:", error)
        setError("Error al cargar los idiomas existentes")
        // En caso de error, inicializar con elemento vacío
        setItems([
          {
            id: "",
            language: "",
            speaking_level: "",
            reading_level: "",
            writing_level: "",
          },
        ])
      } finally {
        setLoadingData(false)
        setIsInitialized(true)
      }
    }

    if (userId) {
      loadLanguages()
    }
  }, [userId])

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: "",
        language: "",
        speaking_level: "",
        reading_level: "",
        writing_level: "",
      },
    ])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Validar que todos los campos requeridos estén completos
      const incompleteItems = items.filter(
        (item) => !item.language || !item.speaking_level || !item.reading_level || !item.writing_level,
      )

      if (incompleteItems.length > 0) {
        throw new Error("Por favor complete todos los campos requeridos en cada idioma")
      }

      // Crear un nuevo cliente Supabase para cada operación
      const supabase = createClient()

      // Eliminar todos los idiomas existentes para este usuario con reintentos
      const { error: deleteError } = await retryOperation(async () => {
        return await supabase.from("languages").delete().eq("user_id", userId)
      })

      if (deleteError) throw deleteError

      // Insertar los nuevos idiomas con reintentos
      const languageData = items.map((item) => ({
        user_id: userId,
        language: item.language,
        speaking_level: item.speaking_level,
        reading_level: item.reading_level,
        writing_level: item.writing_level,
      }))

      const { error: insertError } = await retryOperation(async () => {
        return await supabase.from("languages").insert(languageData)
      })

      if (insertError) throw insertError

      // Actualizar el estado del perfil con reintentos
      const { error: profileError } = await retryOperation(async () => {
        return await supabase.from("profiles").update({ languages_completed: true }).eq("id", userId)
      })

      if (profileError) throw profileError

      setSuccessMessage("Idiomas guardados correctamente")

      // Refrescar la página después de un breve retraso
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error al guardar idiomas:", error)

      // Manejar específicamente errores de rate limiting
      if (error.message && error.message.includes("Too Many")) {
        setError("Demasiadas solicitudes. Por favor, espere un momento e intente guardar nuevamente.")
      } else {
        setError(error.message || "Error al guardar los idiomas")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (index: number) => {
    try {
      // Marcar el elemento como "eliminando" para UI
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], isDeleting: true }
      setItems(updatedItems)

      // Eliminar el elemento del estado local
      const newItems = [...items]
      newItems.splice(index, 1)

      // Si no quedan elementos, añadir uno vacío
      if (newItems.length === 0) {
        newItems.push({
          id: "",
          language: "",
          speaking_level: "",
          reading_level: "",
          writing_level: "",
        })
      }

      setItems(newItems)

      // Refrescar la página después de un breve retraso
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: any) {
      console.error("Error al eliminar el idioma:", error)

      // Quitar el estado "eliminando" si hay error
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], isDeleting: false }
      setItems(updatedItems)
    }
  }

  const levelOptions = [
    { value: "R", label: "Regular (R)" },
    { value: "B", label: "Bueno (B)" },
    { value: "MB", label: "Muy Bueno (MB)" },
  ]

  // Mostrar un indicador de carga mientras se inicializa
  if (!isInitialized || loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Idiomas</CardTitle>
          <CardDescription>
            {error ? <span className="text-red-500">{error}</span> : "Cargando información de idiomas..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Idiomas</CardTitle>
        <CardDescription>Agregue los idiomas que conoce y su nivel de dominio</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {items.map((item, index) => (
            <div key={index} className={`space-y-4 p-4 border rounded-lg ${item.isDeleting ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Idioma {index + 1}</h3>
                {items.length > 1 && (
                  <DeleteConfirmation
                    onDelete={() => handleRemoveItem(index)}
                    itemName="idioma"
                    buttonSize="sm"
                    variant="destructive"
                    tableName="languages"
                    itemId={item.id}
                    userId={userId}
                    documentKey={`${userId}/language_${index}`}
                    onSuccess={() => {
                      setSuccessMessage(`Idioma ${index + 1} eliminado correctamente`)
                      setTimeout(() => setSuccessMessage(null), 3000)
                    }}
                    onError={(error) => {
                      setError(`Error al eliminar el idioma: ${error.message || "Error desconocido"}`)
                      setTimeout(() => setError(null), 3000)
                    }}
                    disabled={loading || item.isDeleting}
                  />
                )}
              </div>

              <div className="space-y-2">
                <ValidatedInput
                  id={`language-${index}`}
                  label="Idioma *"
                  value={item.language}
                  onChange={(e) => handleItemChange(index, "language", e.target.value)}
                  validationRules={[validationRules.required, validationRules.name]}
                  sanitizer="name"
                  required
                  disabled={loading || item.isDeleting}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <Label>Nivel al Hablar *</Label>
                  <RadioGroup
                    value={item.speaking_level}
                    onValueChange={(value) => handleItemChange(index, "speaking_level", value)}
                    className="flex flex-col space-y-2"
                    required
                    disabled={loading || item.isDeleting}
                  >
                    {levelOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`speaking-${index}-${option.value}`} />
                        <Label htmlFor={`speaking-${index}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label>Nivel al Leer *</Label>
                  <RadioGroup
                    value={item.reading_level}
                    onValueChange={(value) => handleItemChange(index, "reading_level", value)}
                    className="flex flex-col space-y-2"
                    required
                    disabled={loading || item.isDeleting}
                  >
                    {levelOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`reading-${index}-${option.value}`} />
                        <Label htmlFor={`reading-${index}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label>Nivel al Escribir *</Label>
                  <RadioGroup
                    value={item.writing_level}
                    onValueChange={(value) => handleItemChange(index, "writing_level", value)}
                    className="flex flex-col space-y-2"
                    required
                    disabled={loading || item.isDeleting}
                  >
                    {levelOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`writing-${index}-${option.value}`} />
                        <Label htmlFor={`writing-${index}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <Label>Documento de Soporte *</Label>
                <DocumentUpload
                  userId={userId}
                  documentType={`language_${index}`}
                  itemId={`language_${index}`}
                  label="Subir certificado de idioma"
                  disabled={loading || item.isDeleting}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={handleAddItem} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Agregar Idioma
          </Button>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              "Guardar Idiomas"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
