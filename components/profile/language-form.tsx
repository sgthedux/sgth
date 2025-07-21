"use client"

import { Label } from "@/components/ui/label"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
    if (dbLanguages && dbLanguages.length > 0 && items.length === 1 && !items[0].language) {
      console.log("🔄 Cargando datos de idiomas desde BD:", dbLanguages)
      console.log("🔄 Datos incluyen document_url:", dbLanguages.map(lang => ({
        language: lang.language,
        document_url: lang.document_url
      })))
      
      // Agregar tempId y document_url a datos existentes si no los tienen
      const itemsWithTempId = dbLanguages.map((item: any) => ({
        ...item,
        document_url: item.document_url || "",
        tempId: item.tempId || `language_${item.id || Date.now()}`
      }))
      setItems(itemsWithTempId)
    }
  }, [dbLanguages, items, setItems])

  const [loading, setLoading] = useState(false)

  const handleAddItem = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const tempId = `language_${timestamp}_${random}`
    console.log("🆕 Creando nuevo idioma con tempId:", tempId)
    
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
    console.log("🔥 DOCUMENTO IDIOMA SUBIDO - URL recibida:", documentUrl)
    console.log("🔥 DOCUMENTO IDIOMA SUBIDO - Guardando en índice:", index)
    console.log("🔥 DOCUMENTO IDIOMA SUBIDO - Item actual antes:", items[index])
    
    const newItems = [...items]
    newItems[index] = { ...newItems[index], document_url: documentUrl }
    setItems(newItems)
    
    console.log("🔥 DOCUMENTO IDIOMA SUBIDO - Item actual después:", newItems[index])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    console.log("🔄 INICIANDO GUARDADO DE IDIOMAS")
    setLoading(true)

    try {
      console.log("🔄 Validando campos obligatorios...")
      // Validar que no haya campos obligatorios vacíos
      const invalidItems = items.filter(item => 
        !item.language.trim() || 
        !item.speaking_level || 
        !item.reading_level || 
        !item.writing_level
      )
      
      if (invalidItems.length > 0) {
        console.log("❌ Validación fallida")
        notifications.error.validation("Por favor complete todos los campos: idioma y niveles de habla, lectura y escritura")
        setLoading(false)
        return
      }

      console.log("🔄 Obteniendo idiomas existentes...")
      // Obtener idiomas existentes para comparar
      const { data: existingLanguages, error: fetchError } = await supabase
        .from("languages")
        .select("*")
        .eq("user_id", userId)

      if (fetchError) throw fetchError

      console.log("🔄 Preparando datos para guardado...")
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
          document_url: item.document_url || null
        }
      })

      console.log("🔥 GUARDANDO IDIOMAS:")
      console.log("🔥 - items originales:", items)
      console.log("🔥 - languageData con document_url:", languageData)
      console.log("🔥 - document_url en cada item:", languageData.map(item => ({ language: item.language, document_url: item.document_url })))

      // Filtrar duplicados
      const uniqueLanguageData = languageData.filter((item, index, self) =>
        index === self.findIndex((l) => l.language === item.language)
      )

      console.log("🔄 Eliminando idiomas que ya no están en la lista...")
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

      console.log("=== DEBUG LANGUAGE SAVE ===")
      console.log("userId:", userId)
      console.log("items:", items)
      console.log("items type:", typeof items)
      console.log("items isArray:", Array.isArray(items))
      console.log("languageData:", languageData)
      console.log("uniqueLanguageData:", uniqueLanguageData)
      console.log("=== END DEBUG ===")

      // Manejar el upsert de forma más robusta
      const savedLanguages: any[] = []
      for (const langData of uniqueLanguageData) {
        try {
          console.log(`🔥 Guardando idioma: ${langData.language}`)
          if (langData.id) {
            // Actualizar idioma existente
            const { data, error } = await supabase
              .from("languages")
              .update(langData)
              .eq("id", langData.id)
              .select()
              .single()
            
            if (error) {
              console.error("Error updating language:", error)
              throw error
            }
            savedLanguages.push(data)
            console.log(`✅ Idioma actualizado: ${langData.language}`)
          } else {
            // Insertar nuevo idioma
            const { id, ...insertData } = langData
            const { data, error } = await supabase
              .from("languages")
              .insert(insertData)
              .select()
              .single()
            
            if (error) {
              console.error("Error inserting language:", error)
              throw error
            }
            savedLanguages.push(data)
            console.log(`✅ Idioma insertado: ${langData.language}`)
          }
        } catch (error) {
          console.error(`❌ Error saving language ${langData.language}:`, error)
          // Continuar con los siguientes idiomas
          continue
        }
      }

      console.log("🔥 TOTAL IDIOMAS GUARDADOS:", savedLanguages.length)

      console.log("🔄 Actualizando items con IDs reales...")
      // Actualizar los items con los IDs reales si es necesario
      const updatedItems = items.map(item => {
        const savedLang = savedLanguages.find(lang => lang.language === item.language)
        return savedLang?.id ? { ...item, id: savedLang.id } : item
      })
      
      setItems(updatedItems)
      console.log("✅ Items actualizados con IDs")

      console.log("🔄 Actualizando perfil...")
      // Update profile status
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ languages_completed: true })
          .eq("id", userId)

        if (profileError) {
          console.error("Error al actualizar el perfil:", profileError)
        } else {
          console.log("✅ Perfil actualizado")
        }
      } catch (profileErr) {
        console.error("Error en actualización de perfil:", profileErr)
      }

      console.log("🔄 Limpiando cache...")
      // Limpiar cache después de guardar exitosamente
      clearCache()
      
      console.log("🔄 Mostrando notificación de éxito...")
      notifications.success.save("Información de idiomas")
      
      console.log("✅ GUARDADO COMPLETADO - Quitando loading")
      
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
      console.log("🔄 FINALLY: Quitando loading...")
      setLoading(false)
      console.log("✅ FINALLY: Loading quitado")
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
