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
import { Textarea } from "@/components/ui/textarea"
import { DocumentUpload } from "@/components/profile/document-upload"
import { RobustDocumentUpload } from "@/components/profile/robust-document-upload"
import { AutoDocumentUpload } from "@/components/profile/auto-document-upload"
import { DatePicker } from "@/components/date-picker"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"
import { useUser } from "@/hooks/use-user"
import { secureDB } from "@/lib/supabase/secure-client"
import { useFormCache } from "@/hooks/use-form-cache"
import { useDBData } from "@/hooks/use-db-data"
import { useDocumentRefs } from "@/hooks/use-document-refs"
import { notifications } from "@/lib/notifications"

interface ExperienceFormProps {
  userId: string
  experiences?: Array<{
    id: string
    tempId?: string
    company: string
    position: string
    start_date: string
    end_date: string | null
    current: boolean
    description: string
    sector?: string
    state?: string
    city?: string
    company_email?: string
    company_phone?: string
    company_address?: string
    department?: string
    document_url?: string | null
  }>
}

export function ExperienceForm({ userId, experiences = [] }: ExperienceFormProps) {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()

  // Configuración inicial de datos memoizada
  const initialData = useMemo(() => [{
    id: "",
    tempId: undefined as string | undefined,
    company: "",
    position: "",
    start_date: "",
    end_date: null,
    current: false,
    description: "",
    sector: "private",
    state: "",
    city: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    department: "",
    document_url: null,
  }], [])

  // Cache local de datos del formulario
  const {
    data: items,
    updateData: setItems,
    isDirty,
    clearCache
  } = useFormCache(initialData, {
    formKey: 'experience',
    userId,
    autoSave: true
  })

  // Carga automática de datos desde la base de datos
  const {
    data: dbExperiences,
    loading: loadingData,
    error: dbError,
    refetch: refetchExperiences
  } = useDBData<any>({
    userId,
    table: 'experience',
    enabled: !!userId
  })

  // Cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (dbExperiences && !dataInitialized.current) {
      if (dbExperiences.length > 0) {
        // Siempre cargar todos los datos de la BD para mantener consistencia
        setItems(dbExperiences)
      } else {
        // Si no hay datos en BD, mantener un item inicial vacío
        setItems(initialData)
      }
      dataInitialized.current = true
    }
  }, [dbExperiences, setItems, initialData])

  const [loading, setLoading] = useState(false)
  const dataInitialized = useRef(false)

  // Resetear el flag cuando cambie el usuario
  useEffect(() => {
    dataInitialized.current = false
  }, [userId])

  // Hook para manejar referencias a documentos
  const { addDocumentRef, removeDocumentRef, getAllDocumentUrls } = useDocumentRefs()

  const handleAddItem = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const tempId = `experience_${timestamp}_${random}`
    console.log("🆕 Creando nueva experiencia con tempId:", tempId)
    
    const newItems = [
      ...items,
      {
        id: "",
        tempId: tempId,
        company: "",
        position: "",
        start_date: "",
        end_date: null,
        current: false,
        description: "",
        sector: "private",
        state: "",
        city: "",
        company_email: "",
        company_phone: "",
        company_address: "",
        department: "",
        document_url: null,
      },
    ]
    setItems(newItems)
  }

  const handleRemoveItem = async (index: number) => {
    try {
      // Obtener el item a eliminar
      const itemToRemove = items[index]
      
      // Limpiar referencias de documentos si existe tempId
      if (itemToRemove.tempId) {
        removeDocumentRef(itemToRemove.tempId)
      }
      
      // Eliminar el elemento del estado local
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)

      notifications.success.delete(`Experiencia ${index + 1}`)
    } catch (error) {
      console.error("Error al eliminar la experiencia:", error)
      notifications.error.delete("la experiencia")
    }
  }

  const handleCurrentChange = (index: number, checked: boolean) => {
    console.log(`Cambiando trabajo actual para índice ${index} a: ${checked}`)
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      current: checked,
      end_date: checked ? null : newItems[index].end_date,
    }
    setItems(newItems)
    console.log("Estado actualizado:", newItems[index])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Función para guardar cada elemento individualmente y evitar duplicación
  const saveExperienceDataIndividually = async (experienceItems: any[]) => {
    const savedItems = []
    
    for (const item of experienceItems) {
      try {
        // Verificar si ya existe una experiencia con la misma empresa, posición y fecha de inicio
        const { data: existingExperience, error: checkError } = await supabase
          .from("experience")
          .select("*")
          .eq("user_id", userId)
          .eq("company", item.company.trim())
          .eq("position", item.position.trim())
          .eq("start_date", item.start_date)
          .single()

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking existing experience:", checkError)
          continue
        }

        // Preparar datos limpios
        const cleanData = {
          user_id: userId,
          company: item.company.trim(),
          position: item.position.trim(),
          start_date: item.start_date,
          end_date: item.current ? null : item.end_date || null,
          current: Boolean(item.current),
          description: item.description?.trim() || null,
          sector: item.sector || "private",
          state: item.state?.trim() || null,
          city: item.city?.trim() || null,
          company_email: item.company_email?.trim() || null,
          company_phone: item.company_phone?.trim() || null,
          company_address: item.company_address?.trim() || null,
          department: item.department?.trim() || null,
          document_url: item.document_url || null // Usar la URL si existe
        }

        console.log("🔥 GUARDANDO EXPERIENCIA:")
        console.log("🔥 - Company:", item.company)
        console.log("🔥 - Position:", item.position)
        console.log("🔥 - document_url en item:", item.document_url)
        console.log("🔥 - cleanData completo:", cleanData)
        console.log("🔥 - document_url en cleanData:", cleanData.document_url)

        let savedItem
        if (existingExperience) {
          // Actualizar registro existente
          const { data, error } = await supabase
            .from("experience")
            .update(cleanData)
            .eq("id", existingExperience.id)
            .select()
            .single()

          if (error) {
            console.error("Error updating experience:", error)
            throw error
          }
          
          savedItem = data
        } else {
          // Crear nuevo registro
          const { data, error } = await supabase
            .from("experience")
            .insert(cleanData)
            .select()
            .single()

          if (error) {
            console.error("Error inserting experience:", error)
            throw error
          }
          
          savedItem = data
        }

        // Agregar información temporal para el mapeo de documentos
        if (!item.id) {
          savedItem.tempId = item.tempId || `experience_${savedItems.length + 1}`
        }
        
        savedItems.push(savedItem)
      } catch (error) {
        console.error("Error saving experience item:", error)
        // Continuar con los siguientes items incluso si uno falla
        continue
      }
    }
    
    return savedItems
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevenir múltiples envíos
    if (loading) return
    
    console.log("🔄 INICIANDO GUARDADO DE EXPERIENCIA")
    setLoading(true)

    try {
      console.log("🔄 Validando campos obligatorios...")
      // Validar que no haya campos obligatorios vacíos
      const invalidItems = items.filter(item => 
        !item.company.trim() || 
        !item.position.trim() || 
        !item.start_date
      )
      
      if (invalidItems.length > 0) {
        console.log("❌ Validación fallida")
        notifications.error.validation("Por favor complete todos los campos obligatorios: empresa, cargo y fecha de inicio")
        setLoading(false)
        return
      }

      console.log("🔄 Guardando elementos individualmente...")
      // Guardar cada elemento individualmente para evitar duplicación
      const savedItems = await saveExperienceDataIndividually(items)
      console.log("✅ Elementos guardados:", savedItems.length)
      
      console.log("🔄 Actualizando items con IDs reales...")
      // Actualizar los items con los IDs reales de la base de datos
      const updatedItems = [...items]
      savedItems.forEach((savedItem: any) => {
        const index = updatedItems.findIndex(item => 
          item.company === savedItem.company &&
          item.position === savedItem.position &&
          item.start_date === savedItem.start_date
        )
        
        if (index !== -1) {
          updatedItems[index] = { ...updatedItems[index], id: savedItem.id }
        }
      })
      
      setItems(updatedItems)
      console.log("✅ Items actualizados con IDs")
      
      console.log("🔄 Mostrando notificación de éxito...")
      notifications.success.save("Experiencia laboral guardada exitosamente")
      
      console.log("🔄 Actualizando perfil...")
      // Actualizar el estado del perfil
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ experience_completed: true })
          .eq("id", userId)

        if (profileError) {
          console.error("Error al actualizar el perfil:", profileError)
        } else {
          console.log("✅ Perfil actualizado")
        }
      } catch (profileErr) {
        console.error("Error en actualización de perfil:", profileErr)
      }
      
      console.log("✅ GUARDADO COMPLETADO - Quitando loading")
      
    } catch (error) {
      console.error("❌ Error al guardar experiencia:", error)
      notifications.error.save("Error al guardar la experiencia laboral")
    } finally {
      // SIEMPRE quitar loading, sin importar qué pase
      console.log("🔄 FINALLY: Quitando loading...")
      setLoading(false)
      console.log("✅ FINALLY: Loading quitado")
    }
  }

  const handleResetForm = () => {
    setItems(initialData)
    // Limpiar caché
    clearCache()
  }

  // Mostrar indicador de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Experiencia Laboral</CardTitle>
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
        <CardTitle>Experiencia Laboral</CardTitle>
        <CardDescription>Agregue su experiencia laboral completa</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Experiencia {index + 1}</h3>
                {items.length > 1 && (
                  <DeleteConfirmation
                    onDelete={() => handleRemoveItem(index)}
                    itemName="experiencia laboral"
                    buttonSize="sm"
                    variant="ghost"
                    tableName="experience"
                    itemId={item.id}
                    userId={userId}
                    documentKey={`${userId}/experience_${index}`}
                    onSuccess={() => {
                      notifications.success.delete(`Experiencia ${index + 1}`)
                    }}
                    onError={(error) => {
                      notifications.error.delete("experiencia laboral", error.message)
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <ValidatedInput
                    id={`company-${index}`}
                    label="Empresa"
                    value={item.company}
                    onChange={(e) => handleItemChange(index, "company", e.target.value)}
                    validationRules={[validationRules.required, validationRules.text]}
                    sanitizer="text"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <ValidatedInput
                    id={`position-${index}`}
                    label="Cargo"
                    value={item.position}
                    onChange={(e) => handleItemChange(index, "position", e.target.value)}
                    validationRules={[validationRules.required, validationRules.text]}
                    sanitizer="text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`sector-${index}`}>Sector</Label>
                <Select
                  value={item.sector || "private"}
                  onValueChange={(value) => handleItemChange(index, "sector", value)}
                >
                  <SelectTrigger id={`sector-${index}`}>
                    <SelectValue placeholder="Seleccione un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="independent">Independiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <ValidatedInput
                    id={`state-${index}`}
                    label="Departamento"
                    value={item.state || ""}
                    onChange={(e) => handleItemChange(index, "state", e.target.value)}
                    validationRules={[validationRules.name]}
                    sanitizer="name"
                  />
                </div>

                <div className="space-y-2">
                  <ValidatedInput
                    id={`city-${index}`}
                    label="Municipio"
                    value={item.city || ""}
                    onChange={(e) => handleItemChange(index, "city", e.target.value)}
                    validationRules={[validationRules.name]}
                    sanitizer="name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <ValidatedInput
                    id={`company-email-${index}`}
                    label="Correo de la Entidad"
                    type="email"
                    value={item.company_email || ""}
                    onChange={(e) => handleItemChange(index, "company_email", e.target.value)}
                    validationRules={[validationRules.email]}
                    sanitizer="email"
                  />
                </div>

                <div className="space-y-2">
                  <ValidatedInput
                    id={`company-phone-${index}`}
                    label="Teléfono de la Entidad"
                    value={item.company_phone || ""}
                    onChange={(e) => handleItemChange(index, "company_phone", e.target.value)}
                    validationRules={[validationRules.phone]}
                    sanitizer="phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <ValidatedInput
                    id={`department-${index}`}
                    label="Dependencia"
                    value={item.department || ""}
                    onChange={(e) => handleItemChange(index, "department", e.target.value)}
                    validationRules={[validationRules.text]}
                    sanitizer="text"
                  />
                </div>

                <div className="space-y-2">
                  <ValidatedInput
                    id={`company-address-${index}`}
                    label="Dirección de la Entidad"
                    value={item.company_address || ""}
                    onChange={(e) => handleItemChange(index, "company_address", e.target.value)}
                    validationRules={[validationRules.text]}
                    sanitizer="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DatePicker
                  id={`start-date-${index}`}
                  label="Fecha de Inicio"
                  value={item.start_date}
                  onChange={(date) => handleItemChange(index, "start_date", date)}
                  required
                  maxDate={new Date().toISOString().split("T")[0]}
                />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 h-10 mb-2 border p-2 rounded bg-gray-50">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={!!item.current}
                      onChange={(e) => handleCurrentChange(index, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`current-${index}`} className="cursor-pointer font-medium">
                      Trabajo Actual {item.current ? "(Activo)" : ""}
                    </Label>
                  </div>

                  {!item.current ? (
                    <DatePicker
                      id={`end-date-${index}`}
                      label="Fecha de Finalización"
                      value={item.end_date || ""}
                      onChange={(date) => handleItemChange(index, "end_date", date)}
                      required={true}
                      maxDate={new Date().toISOString().split("T")[0]}
                    />
                  ) : (
                    <div className="p-3 border rounded bg-blue-50 text-blue-700 text-sm">
                      No se requiere fecha de finalización para trabajos actuales
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>
                  Descripción de Funciones
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <RobustDocumentUpload
                  ref={(ref) => {
                    if (ref && item.tempId) {
                      addDocumentRef(item.tempId, ref)
                    }
                  }}
                  userId={userId}
                  documentType="experience_certificate"
                  formType="experience"
                  recordId={item.id || item.tempId} // Usar tempId si no hay ID real
                  itemIndex={index}
                  label="Documento de Soporte"
                  required
                  initialDocumentUrl={item.document_url}
                  onUploadSuccess={(url) => {
                    // Guardar la URL en el item actual
                    console.log("🔥 DOCUMENTO SUBIDO - URL recibida:", url)
                    console.log("🔥 DOCUMENTO SUBIDO - Guardando en índice:", index)
                    console.log("🔥 DOCUMENTO SUBIDO - Item actual antes:", items[index])
                    
                    handleItemChange(index, "document_url", url)
                    
                    // Verificar que se guardó correctamente
                    setTimeout(() => {
                      console.log("🔥 DOCUMENTO SUBIDO - Item después del cambio:", items[index])
                    }, 100)
                    
                    console.log("Documento subido exitosamente, URL guardada en item:", url)
                  }}
                  onUploadError={(error) => {
                    console.error("Error al subir documento:", error)
                  }}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Agregar Experiencia
          </Button>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Experiencia Laboral"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
