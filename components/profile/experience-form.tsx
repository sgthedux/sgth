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
import { Textarea } from "@/components/ui/textarea"
import { DocumentUpload } from "@/components/profile/document-upload"
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
import { notifications } from "@/lib/notifications"

interface ExperienceFormProps {
  userId: string
  experiences?: Array<{
    id: string
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
  }>
}

export function ExperienceForm({ userId, experiences = [] }: ExperienceFormProps) {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()

  // Configuración inicial de datos memoizada
  const initialData = useMemo(() => [{
    id: "",
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
    if (dbExperiences && dbExperiences.length > 0 && items.length === 1 && !items[0].company) {
      setItems(dbExperiences)
    }
  }, [dbExperiences, items, setItems])

  const [loading, setLoading] = useState(false)

  const handleAddItem = () => {
    const newItems = [
      ...items,
      {
        id: "",
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
      },
    ]
    setItems(newItems)
  }

  const handleRemoveItem = async (index: number) => {
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevenir múltiples envíos
    if (loading) return
    
    setLoading(true)

    try {
      // Validar que no haya campos obligatorios vacíos
      const invalidItems = items.filter(item => 
        !item.company.trim() || 
        !item.position.trim() || 
        !item.start_date
      )
      
      if (invalidItems.length > 0) {
        notifications.error.validation("Por favor complete todos los campos obligatorios: empresa, cargo y fecha de inicio")
        setLoading(false)
        return
      }

      // Obtener experiencias existentes para comparar
      const { data: existingExperiences, error: fetchError } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", userId)

      if (fetchError) throw fetchError

      // Preparar datos para upsert
      const experienceData = items.map((item) => {
        // Buscar si ya existe una experiencia similar
        const existingItem = existingExperiences?.find(existing => 
          existing.company === item.company &&
          existing.position === item.position &&
          existing.start_date === item.start_date
        )

        // Asegurarse de que los campos de fecha sean null si están vacíos
        const start_date = item.start_date || null
        const end_date = item.current ? null : item.end_date || null

        return {
          id: existingItem?.id || item.id || undefined, // Usar ID existente si lo hay
          user_id: userId,
          company: item.company,
          position: item.position,
          start_date,
          end_date,
          current: item.current,
          description: item.description,
          sector: item.sector,
          state: item.state,
          city: item.city,
          company_email: item.company_email,
          company_phone: item.company_phone,
          company_address: item.company_address,
          department: item.department,
        }
      })

      // Filtrar elementos duplicados basado en empresa, posición y fecha de inicio
      const uniqueExperienceData = experienceData.filter((item, index, self) => 
        index === self.findIndex(t => 
          t.company === item.company && 
          t.position === item.position && 
          t.start_date === item.start_date
        )
      )

      // Primero, eliminar experiencias que ya no están en la lista
      const currentIds = uniqueExperienceData.map(item => item.id).filter(Boolean)
      const existingIds = existingExperiences?.map(item => item.id) || []
      const idsToDelete = existingIds.filter(id => !currentIds.includes(id))

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("experience")
          .delete()
          .in("id", idsToDelete)
        
        if (deleteError) throw deleteError
      }

      console.log("=== DEBUG EXPERIENCE SAVE ===")
      console.log("userId:", userId)
      console.log("items:", items)
      console.log("items type:", typeof items)
      console.log("items isArray:", Array.isArray(items))
      console.log("experienceData:", experienceData)
      console.log("uniqueExperienceData:", uniqueExperienceData)
      console.log("=== END DEBUG ===")

      // Manejar el upsert de forma más robusta
      for (const expData of uniqueExperienceData) {
        if (expData.id) {
          // Actualizar experiencia existente
          const { error } = await supabase
            .from("experience")
            .update(expData)
            .eq("id", expData.id)
          
          if (error) throw error
        } else {
          // Insertar nueva experiencia
          const { id, ...insertData } = expData
          const { error } = await supabase
            .from("experience")
            .insert(insertData)
          
          if (error) throw error
        }
      }

      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ experience_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      // Limpiar cache después de guardar exitosamente
      clearCache()
      
      // Refrescar datos de la base de datos
      refetchExperiences()
      
      notifications.success.save("Experiencia laboral")

      // Esperar un momento antes de refrescar para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error al guardar experiencia:", error)
      
      // Mostrar mensaje de error más amigable
      let errorMessage = "Ocurrió un error inesperado al guardar la experiencia laboral"
      
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Ya existe un registro de experiencia similar"
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente"
      } else if (error.message?.includes("unauthorized") || error.message?.includes("permission")) {
        errorMessage = "No tienes permisos para realizar esta acción"
      } else if (error.message?.includes("column") || error.message?.includes("schema")) {
        errorMessage = "Error en el sistema. Por favor contacta al administrador"
      }
      
      notifications.error.generic(errorMessage)
    } finally {
      setLoading(false)
    }
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
                <AutoDocumentUpload
                  userId={userId}
                  documentType="experience_certificate"
                  formType="experience"
                  itemIndex={index}
                  label="Documento de Soporte"
                  required
                  onUploadSuccess={(url) => {
                    console.log("Documento subido exitosamente:", url)
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
