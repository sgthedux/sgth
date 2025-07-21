"use client"

import { Label } from "@/components/ui/label"
import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RobustDocumentUpload } from "@/components/profile/robust-document-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"
import { useFormCache } from "@/hooks/use-form-cache"
import { useDBData } from "@/hooks/use-db-data"
import { useDocumentRefs } from "@/hooks/use-document-refs"
import { notifications } from "@/lib/notifications"

interface LanguageFormProps {
  userId: string
  languages?: Array<{
    id: string
    language: string
    speaking_level: string
    reading_level: string
    writing_level: string
    document_url?: string
    tempId?: string
  }>
}

export function LanguageForm({ userId, languages = [] }: LanguageFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addDocumentRef, removeDocumentRef } = useDocumentRefs()

  // Configuración inicial de datos memoizada
  const initialData = useMemo(() => [{
    id: "",
    language: "",
    speaking_level: "",
    reading_level: "",
    writing_level: "",
    document_url: "",
    tempId: `language_${Date.now()}` // Agregar tempId para documentos pendientes
  }], [])

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
    if (dbLanguages && !dataInitialized.current) {
      if (dbLanguages.length > 0) {
        // Cargar todos los datos de la BD para mantener consistencia
        const itemsWithTempId = dbLanguages.map((item: any) => ({
          ...item,
          document_url: item.document_url || "",
          tempId: item.tempId || `language_${item.id || Date.now()}`
        }))
        setItems(itemsWithTempId)
      } else {
        // Si no hay datos en BD, mantener un item inicial vacío
        setItems(initialData)
      }
      dataInitialized.current = true
    }
  }, [dbLanguages, setItems, initialData])

  const [loading, setLoading] = useState(false)
  const dataInitialized = useRef(false)

  // Resetear el flag cuando cambie el usuario
  useEffect(() => {
    dataInitialized.current = false
  }, [userId])

  const handleAddItem = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const tempId = `language_${timestamp}_${random}`
    
    const newItems = [
      ...items,
      {
        id: "",
        language: "",
        speaking_level: "",
        reading_level: "",
        writing_level: "",
        document_url: "",
        tempId: tempId,
      },
    ]
    setItems(newItems)
  }

  const handleRemoveItem = async (index: number) => {
    try {
      const newItems = [...items]
      const itemToRemove = newItems[index]
      
      // Limpiar referencia del documento si existe
      if (itemToRemove.tempId) {
        removeDocumentRef(itemToRemove.tempId)
      }
      
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

  // Callback para cuando se sube un documento
  const handleDocumentUpload = (index: number, documentUrl: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], document_url: documentUrl }
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

      // Preparar datos limpios sin elementos vacíos
      const languageData = items
        .filter(item => item.language.trim()) // Solo idiomas con nombre
        .map((item) => ({
          id: item.id || undefined,
          user_id: userId,
          language: item.language.trim(),
          speaking_level: item.speaking_level,
          reading_level: item.reading_level,
          writing_level: item.writing_level,
          document_url: item.document_url || null
        }))

      // Filtrar duplicados por idioma (mantener el último)
      const uniqueLanguageData = languageData.reduce((acc, current) => {
        const existing = acc.find(item => item.language.toLowerCase() === current.language.toLowerCase())
        if (existing) {
          // Reemplazar el existente con el actual (más reciente)
          const index = acc.indexOf(existing)
          acc[index] = current
        } else {
          acc.push(current)
        }
        return acc
      }, [] as typeof languageData)

      // Guardar idiomas individualmente para mejor control de errores
      const savedLanguages: any[] = []
      for (const langData of uniqueLanguageData) {
        try {
          if (langData.id) {
            // Actualizar idioma existente
            const { data, error } = await supabase
              .from("languages")
              .update({
                language: langData.language,
                speaking_level: langData.speaking_level,
                reading_level: langData.reading_level,
                writing_level: langData.writing_level,
                document_url: langData.document_url
              })
              .eq("id", langData.id)
              .eq("user_id", userId) // Seguridad adicional
              .select()
              .single()
            
            if (error) throw error
            savedLanguages.push(data)
          } else {
            // Verificar si ya existe un idioma similar antes de insertar
            const { data: existing } = await supabase
              .from("languages")
              .select("id")
              .eq("user_id", userId)
              .eq("language", langData.language)
              .single()

            if (existing) {
              // Actualizar el existente en lugar de duplicar
              const { data, error } = await supabase
                .from("languages")
                .update({
                  speaking_level: langData.speaking_level,
                  reading_level: langData.reading_level,
                  writing_level: langData.writing_level,
                  document_url: langData.document_url
                })
                .eq("id", existing.id)
                .select()
                .single()
              
              if (error) throw error
              savedLanguages.push(data)
            } else {
              // Insertar nuevo idioma
              const { data, error } = await supabase
                .from("languages")
                .insert({
                  user_id: langData.user_id,
                  language: langData.language,
                  speaking_level: langData.speaking_level,
                  reading_level: langData.reading_level,
                  writing_level: langData.writing_level,
                  document_url: langData.document_url
                })
                .select()
                .single()
              
              if (error) throw error
              savedLanguages.push(data)
            }
          }
        } catch (error) {
          console.error(`Error saving language ${langData.language}:`, error)
          // Continuar con los siguientes idiomas
          continue
        }
      }

      // Actualizar los items con los datos guardados
      const updatedItems = savedLanguages.map(savedLang => {
        const originalItem = items.find(item => 
          item.language.toLowerCase() === savedLang.language.toLowerCase()
        )
        return {
          ...savedLang,
          tempId: originalItem?.tempId || `language_${savedLang.id}`
        }
      })
      
      setItems(updatedItems)

      // Update profile status
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ languages_completed: true })
          .eq("id", userId)

        if (profileError) {
          console.error("Error al actualizar el perfil:", profileError)
        }
      } catch (profileErr) {
        console.error("Error en actualización de perfil:", profileErr)
      }

      // Limpiar cache después de guardar exitosamente
      clearCache()
      
      notifications.success.save("Información de idiomas guardada exitosamente")
      
    } catch (error: any) {
      console.error("❌ Error al guardar idiomas:", error)
      
      // Mostrar mensaje de error más amigable
      let errorMessage = "Ocurrió un error inesperado al guardar la información de idiomas"
      
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Ya existe un registro de idioma similar"
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente"
      } else if (error.message?.includes("unauthorized") || error.message?.includes("permission")) {
        errorMessage = "No tienes permisos para realizar esta acción"
      } else if (error.message?.includes("column") || error.message?.includes("schema")) {
        errorMessage = "Error en el sistema. Por favor contacta al administrador"
      }
      
      notifications.error.save(errorMessage)
    } finally {
      // SIEMPRE quitar loading, sin importar qué pase
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
          {items.map((item, index) => (
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
                    documentKey={`${userId}/language_${index}`}
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
                  <RobustDocumentUpload
                    ref={(ref) => {
                      if (ref && item.tempId) {
                        addDocumentRef(item.tempId, ref)
                      }
                    }}
                    userId={userId}
                    formType="language"
                    recordId={item.id || item.tempId} // Usar tempId si no hay ID real
                    itemIndex={index}
                    documentType="language_certificate"
                    label="Certificado de Idioma (Opcional)"
                    initialDocumentUrl={item.document_url}
                    onUploadSuccess={(documentUrl) => handleDocumentUpload(index, documentUrl)}
                  />
                </div>
              </div>
            </div>
          ))}

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
