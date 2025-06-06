"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DocumentUpload } from "@/components/profile/document-upload"
import { DatePicker } from "@/components/date-picker"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"
import { useUser } from "@/hooks/use-user"

import { useToast } from "@/components/ui/use-toast"

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
  const [loadingData, setLoadingData] = useState(true)
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
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Cargar datos existentes del usuario
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) return

      try {
        setLoadingData(true)
        console.log("Cargando experiencia existente para usuario:", user.id)

        const { data: existingExperience, error: existingExperienceError } = await supabase
          .from("experience")
          .select("*")
          .eq("user_id", user.id);

        if (existingExperienceError) {
          console.error("Error fetching existing experience:", existingExperienceError)
          // Handle error appropriately
        } else if (existingExperience && existingExperience.length > 0) {
          setItems(existingExperience)
          console.log("Datos de experiencia cargados exitosamente")
        } else {
          console.log("No se encontró experiencia existente")
        }
      } catch (error) {
        console.error("Error cargando experiencia existente:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos existentes",
        })
      } finally {
        setLoadingData(false)
      }
    }

    loadExistingData()
  }, [user?.id])

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
  }

  const handleRemoveItem = async (index: number) => {
    try {
      // Eliminar el elemento del estado local
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)

      toast({
        variant: "success",
        title: "Éxito",
        description: `Experiencia ${index + 1} eliminada correctamente`,
      })
    } catch (error) {
      console.error("Error al eliminar la experiencia:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la experiencia. Inténtelo de nuevo.",
      })
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
    setLoading(true)

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

      toast({
        variant: "success",
        title: "Éxito",
        description: "Experiencia laboral guardada correctamente",
      })

      // Esperar un momento antes de refrescar para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al guardar la experiencia laboral",
      })
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
                      toast({
                        variant: "success",
                        title: "Éxito",
                        description: `Experiencia ${index + 1} eliminada correctamente`,
                      })
                    }}
                    onError={(error) => {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: `Error al eliminar: ${error.message}`,
                      })
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
                    required={true}
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
                    required={true}
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
