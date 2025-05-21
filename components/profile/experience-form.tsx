"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Plus, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { DocumentUpload } from "@/components/profile/document-upload"
import { DatePicker } from "@/components/date-picker"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [items, setItems] = useState(
    experiences.length > 0
      ? experiences
      : [
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
        ],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClient()

  // Estados para el guardado automático
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const originalItemsRef = useRef<typeof items>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleAddItem = () => {
    setItems([
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
    ])
    setHasUnsavedChanges(true)
  }

  const handleRemoveItem = async (index: number) => {
    try {
      // Eliminar el elemento del estado local
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)
      setHasUnsavedChanges(true)

      // Iniciar guardado automático
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(newItems)
      }, 2000)

      setSuccessMessage(`Experiencia ${index + 1} eliminada correctamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar la experiencia:", error)
      setError("Error al eliminar la experiencia. Inténtelo de nuevo.")
      setTimeout(() => setError(null), 3000)
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
    setHasUnsavedChanges(true)
    console.log("Estado actualizado:", newItems[index])

    // Iniciar el guardado automático
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newItems)
    }, 2000)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    setHasUnsavedChanges(true)

    // Iniciar el guardado automático después de un tiempo de inactividad
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newItems)
    }, 2000) // Guardar después de 2 segundos de inactividad
  }

  // Función para guardar automáticamente
  const autoSave = useCallback(
    async (dataToSave = items) => {
      // No guardar si no hay cambios
      if (!hasUnsavedChanges) return

      setIsSaving(true)
      setSaveStatus("saving")

      try {
        // Delete existing experience records
        if (experiences.length > 0) {
          const { error: deleteError } = await supabase.from("experience").delete().eq("user_id", userId)
          if (deleteError) throw deleteError
        }

        // Insert new experience records
        const experienceData = dataToSave.map((item) => {
          // Asegurarse de que los campos de fecha sean null si están vacíos
          const start_date = item.start_date || null
          const end_date = item.current ? null : item.end_date || null

          return {
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

        const { error: insertError } = await supabase.from("experience").insert(experienceData)
        if (insertError) throw insertError

        // Update profile status
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ experience_completed: true })
          .eq("id", userId)

        if (profileError) throw profileError

        // Actualizar el estado después de guardar
        setHasUnsavedChanges(false)
        setSaveStatus("saved")
        originalItemsRef.current = JSON.parse(JSON.stringify(dataToSave))

        // Mostrar mensaje de éxito brevemente
        setSuccessMessage("Experiencia laboral guardada automáticamente")
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } catch (error: any) {
        console.error("Error al guardar automáticamente:", error)
        setSaveStatus("error")
        setError(`Error al guardar: ${error.message}`)
        setTimeout(() => {
          setError(null)
        }, 3000)
      } finally {
        setIsSaving(false)
      }
    },
    [hasUnsavedChanges, items, experiences.length, supabase, userId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setSaveStatus("saving")

    try {
      // Delete existing experience records
      if (experiences.length > 0) {
        const { error: deleteError } = await supabase.from("experience").delete().eq("user_id", userId)
        if (deleteError) throw deleteError
      }

      // Insert new experience records
      const experienceData = items.map((item) => {
        // Asegurarse de que los campos de fecha sean null si están vacíos
        const start_date = item.start_date || null
        const end_date = item.current ? null : item.end_date || null

        return {
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

      const { error: insertError } = await supabase.from("experience").insert(experienceData)
      if (insertError) throw insertError

      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ experience_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      setSuccessMessage("Experiencia laboral guardada correctamente")
      setHasUnsavedChanges(false)
      setSaveStatus("saved")
      originalItemsRef.current = JSON.parse(JSON.stringify(items))

      // Esperar un momento antes de refrescar para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Error al guardar la experiencia laboral")
      setSaveStatus("error")
    } finally {
      setLoading(false)
    }
  }

  // Inicializar el estado original para comparar cambios
  useEffect(() => {
    originalItemsRef.current = JSON.parse(JSON.stringify(items))
  }, [])

  // Limpiar el timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Experiencia Laboral</CardTitle>
            <CardDescription>Agregue su experiencia laboral completa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && <span className="text-amber-600 text-sm font-medium">Cambios sin guardar</span>}
            {saveStatus === "saving" && (
              <span className="text-blue-600 text-sm font-medium flex items-center">
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Guardando...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-600 text-sm font-medium flex items-center">
                <Save className="h-3 w-3 mr-1" />
                Guardado
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-600 text-sm font-medium flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error al guardar
              </span>
            )}
          </div>
        </div>
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
                      setSuccessMessage(`Experiencia ${index + 1} eliminada correctamente`)
                      setTimeout(() => setSuccessMessage(null), 3000)
                    }}
                    onError={(error) => {
                      setError(`Error al eliminar: ${error.message}`)
                      setTimeout(() => setError(null), 3000)
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`company-${index}`}>Empresa *</Label>
                  <Input
                    id={`company-${index}`}
                    value={item.company}
                    onChange={(e) => handleItemChange(index, "company", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`position-${index}`}>Cargo *</Label>
                  <Input
                    id={`position-${index}`}
                    value={item.position}
                    onChange={(e) => handleItemChange(index, "position", e.target.value)}
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
                  <Label htmlFor={`state-${index}`}>Departamento</Label>
                  <Input
                    id={`state-${index}`}
                    value={item.state || ""}
                    onChange={(e) => handleItemChange(index, "state", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`city-${index}`}>Municipio</Label>
                  <Input
                    id={`city-${index}`}
                    value={item.city || ""}
                    onChange={(e) => handleItemChange(index, "city", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`company-email-${index}`}>Correo de la Entidad</Label>
                  <Input
                    id={`company-email-${index}`}
                    type="email"
                    value={item.company_email || ""}
                    onChange={(e) => handleItemChange(index, "company_email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`company-phone-${index}`}>Teléfono de la Entidad</Label>
                  <Input
                    id={`company-phone-${index}`}
                    value={item.company_phone || ""}
                    onChange={(e) => handleItemChange(index, "company_phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`department-${index}`}>Dependencia</Label>
                  <Input
                    id={`department-${index}`}
                    value={item.department || ""}
                    onChange={(e) => handleItemChange(index, "department", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`company-address-${index}`}>Dirección de la Entidad</Label>
                  <Input
                    id={`company-address-${index}`}
                    value={item.company_address || ""}
                    onChange={(e) => handleItemChange(index, "company_address", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DatePicker
                  id={`start-date-${index}`}
                  label="Fecha de Inicio *"
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
                      label="Fecha de Finalización *"
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
                <Label htmlFor={`description-${index}`}>Descripción de Funciones *</Label>
                <Textarea
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Documento de Soporte *</Label>
                <DocumentUpload
                  userId={userId}
                  documentType={`experience_${index}`}
                  itemId={`experience_${index}`}
                  label="Subir certificado laboral"
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
