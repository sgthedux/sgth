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
import { AutoDocumentUpload } from "@/components/profile/auto-document-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"
import { useFormCache } from "@/hooks/use-form-cache"
import { useDBData } from "@/hooks/use-db-data"
import { notifications } from "@/lib/notifications"

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

export function LanguageForm({ userId, languages = [] }: LanguageFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Configuración inicial de datos
  const initialData = [{
    id: "",
    language: "",
    speaking_level: "",
    reading_level: "",
    writing_level: "",
  }]

  // Cache local de datos del formulario
  const {
    data: items,
    updateData: setItems,
    isDirty,
    clearCache
  } = useFormCache(initialData, {
    formKey: 'languages',
    userId,
    autoSave: true
  })

  // Carga automática de datos desde la base de datos
  const {
    data: dbLanguages,
    loading: loadingData,
    error: dbError,
    refetch: refetchLanguages
  } = useDBData<any>({
    userId,
    table: 'languages',
    enabled: !!userId
  })

  // Cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (dbLanguages && dbLanguages.length > 0 && items.length === 1 && !items[0].language) {
      setItems(dbLanguages)
    }
  }, [dbLanguages, items, setItems])

  const [loading, setLoading] = useState(false)

  const handleAddItem = () => {
    const newItems = [
      ...items,
      {
        id: "",
        language: "",
        speaking_level: "",
        reading_level: "",
        writing_level: "",
      },
    ]
    setItems(newItems)
  }

  const handleRemoveItem = async (index: number) => {
    try {
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)
      notifications.success.delete(`Idioma ${index + 1}`)
    } catch (error) {
      console.error("Error al eliminar idioma:", error)
      notifications.error.delete("el idioma")
    }
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    setLoading(true)

    try {
      // Validar que no haya campos obligatorios vacíos
      const invalidItems = items.filter(item => 
        !item.language.trim() || 
        !item.speaking_level || 
        !item.reading_level || 
        !item.writing_level
      )
      
      if (invalidItems.length > 0) {
        notifications.error.validation("Por favor complete todos los campos: idioma y niveles de habla, lectura y escritura")
        setLoading(false)
        return
      }

      // Obtener idiomas existentes para comparar
      const { data: existingLanguages, error: fetchError } = await supabase
        .from("languages")
        .select("*")
        .eq("user_id", userId)

      if (fetchError) throw fetchError

      // Preparar datos para upsert
      const languageData = items.map((item) => {
        // Buscar si ya existe un idioma similar
        const existingItem = existingLanguages?.find(existing => 
          existing.language === item.language
        )

        return {
          id: existingItem?.id || item.id || undefined,
          user_id: userId,
          language: item.language,
          speaking_level: item.speaking_level,
          reading_level: item.reading_level,
          writing_level: item.writing_level,
        }
      })

      // Filtrar duplicados
      const uniqueLanguageData = languageData.filter((item, index, self) =>
        index === self.findIndex((l) => l.language === item.language)
      )

      // Primero, eliminar idiomas que ya no están en la lista
      const currentIds = uniqueLanguageData.map(item => item.id).filter(Boolean)
      const existingIds = existingLanguages?.map(item => item.id) || []
      const idsToDelete = existingIds.filter(id => !currentIds.includes(id))

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("languages")
          .delete()
          .in("id", idsToDelete)
        
        if (deleteError) throw deleteError
      }

      // Usar upsert para insertar o actualizar
      const { error: upsertError } = await supabase
        .from("languages")
        .upsert(uniqueLanguageData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (upsertError) throw upsertError

      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ languages_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      // Limpiar cache después de guardar exitosamente
      clearCache()
      
      // Refrescar datos de la base de datos
      refetchLanguages()
      
      notifications.success.save("Información de idiomas")

      // Esperar un momento antes de refrescar
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error al guardar idiomas:", error)
      notifications.error.save("información de idiomas", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar indicador de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Idiomas</CardTitle>
          <CardDescription>Cargando información existente...</CardDescription>
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
        <CardDescription>Seleccione los idiomas que domina y su nivel de competencia</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {items.map((item, index) => {
            // Crear documentType único para cada registro de idioma
            const documentType = `language_${item.id || item.tempId || index}`
            
            return (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Idioma {index + 1}</h3>
                {items.length > 1 && (
                  <DeleteConfirmation
                    onDelete={() => handleRemoveItem(index)}
                    itemName="idioma"
                    buttonSize="sm"
                    variant="ghost"
                    tableName="languages"
                    itemId={item.id}
                    userId={userId}
                    documentKey={`${userId}/language_${item.id || item.tempId || index}`}
                    onSuccess={() => {
                      notifications.success.delete(`Idioma ${index + 1}`)
                    }}
                    onError={(error) => {
                      notifications.error.delete("idioma", error.message)
                    }}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <ValidatedInput
                    id={`language-${index}`}
                    label="Idioma"
                    value={item.language}
                    onChange={(e) => handleItemChange(index, "language", e.target.value)}
                    validationRules={[validationRules.required, validationRules.text]}
                    sanitizer="text"
                    required
                    placeholder="Ej: Inglés, Francés, Alemán"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Nivel de Habla */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Nivel de Habla</Label>
                    <RadioGroup
                      value={item.speaking_level}
                      onValueChange={(value) => handleItemChange(index, "speaking_level", value)}
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id={`speaking-basic-${index}`} />
                        <Label htmlFor={`speaking-basic-${index}`} className="text-sm">Básico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id={`speaking-intermediate-${index}`} />
                        <Label htmlFor={`speaking-intermediate-${index}`} className="text-sm">Intermedio</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id={`speaking-advanced-${index}`} />
                        <Label htmlFor={`speaking-advanced-${index}`} className="text-sm">Avanzado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="native" id={`speaking-native-${index}`} />
                        <Label htmlFor={`speaking-native-${index}`} className="text-sm">Nativo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Nivel de Lectura */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Nivel de Lectura</Label>
                    <RadioGroup
                      value={item.reading_level}
                      onValueChange={(value) => handleItemChange(index, "reading_level", value)}
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id={`reading-basic-${index}`} />
                        <Label htmlFor={`reading-basic-${index}`} className="text-sm">Básico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id={`reading-intermediate-${index}`} />
                        <Label htmlFor={`reading-intermediate-${index}`} className="text-sm">Intermedio</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id={`reading-advanced-${index}`} />
                        <Label htmlFor={`reading-advanced-${index}`} className="text-sm">Avanzado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="native" id={`reading-native-${index}`} />
                        <Label htmlFor={`reading-native-${index}`} className="text-sm">Nativo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Nivel de Escritura */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Nivel de Escritura</Label>
                    <RadioGroup
                      value={item.writing_level}
                      onValueChange={(value) => handleItemChange(index, "writing_level", value)}
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id={`writing-basic-${index}`} />
                        <Label htmlFor={`writing-basic-${index}`} className="text-sm">Básico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id={`writing-intermediate-${index}`} />
                        <Label htmlFor={`writing-intermediate-${index}`} className="text-sm">Intermedio</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id={`writing-advanced-${index}`} />
                        <Label htmlFor={`writing-advanced-${index}`} className="text-sm">Avanzado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="native" id={`writing-native-${index}`} />
                        <Label htmlFor={`writing-native-${index}`} className="text-sm">Nativo</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Subida de Documentos */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Certificado de Idioma (Opcional)</Label>
                  <AutoDocumentUpload
                    userId={userId}
                    documentKey={`${userId}/${documentType}`}
                    documentType={documentType}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5}
                    description="Suba certificados de idiomas como TOEFL, IELTS, DELE, etc."
                  />
                </div>
              </div>
            </div>
            )
          })}

          <Button
            type="button"
            onClick={handleAddItem}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro idioma
          </Button>
        </CardContent>

        <CardFooter className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando..." : "Guardar Idiomas"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
