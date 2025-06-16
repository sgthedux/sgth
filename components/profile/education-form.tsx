"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/profile/document-upload"
import { AutoDocumentUpload } from "@/components/profile/auto-document-upload"
import { DatePicker } from "@/components/date-picker"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { ValidatedInput } from "@/components/ui/validated-input"
import { validationRules } from "@/lib/validations"
import { useUser } from "@/hooks/use-user"
import { secureDB } from "@/lib/supabase/secure-client"
import { useFormCache } from "@/hooks/use-form-cache"
import { useDBData } from "@/hooks/use-db-data"
import { notifications } from "@/lib/notifications"

interface EducationFormProps {
  userId: string
  educations?: Array<{
    id: string
    education_type: string
    institution: string
    degree: string
    field_of_study: string
    level: string
    graduation_date: string | null
    start_date: string
    end_date: string | null
    current: boolean
    semesters_completed: number | null
    graduated: boolean
    professional_card_number: string | null
    description: string | null
    institution_country: string | null
    title_validated: boolean | null
    ies_code: string | null
    academic_modality: string | null
  }>
}

export function EducationForm({ userId, educations = [] }: EducationFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const { user } = useUser()
  const supabase = createClient()

  // Configuración inicial de datos con useMemo
  const initialData = useMemo(() => [{
    id: "",
    education_type: "basic",
    institution: "",
    degree: "",
    field_of_study: "",
    level: "",
    graduation_date: null,
    start_date: "",
    end_date: null,
    current: false,
    semesters_completed: null,
    graduated: false,
    professional_card_number: null,
    description: "",
    institution_country: "Colombia",
    title_validated: false,
    ies_code: "",
    academic_modality: "",
  }], [])

  // Cache local de datos del formulario
  const {
    data: items,
    updateData: setItems,
    isDirty,
    clearCache
  } = useFormCache(initialData, {
    formKey: 'education',
    userId,
    autoSave: true
  })

  // Carga automática de datos desde la base de datos
  const {
    data: dbEducations,
    loading: loadingData,
    error: dbError,
    refetch: refetchEducations
  } = useDBData<any>({
    userId,
    table: 'education',
    enabled: !!userId
  })

  // Cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (dbEducations && dbEducations.length > 0 && items.length === 1 && !items[0].institution) {
      setItems(dbEducations)
    }
  }, [dbEducations, items, setItems])

  const [loading, setLoading] = useState(false)
  const [academicModalities, setAcademicModalities] = useState<any[]>([])

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // Cargar modalidades académicas
        const { data: modalities, error: modalitiesError } = await supabase
          .from("academic_modalities")
          .select("id, name")
          .order("name")

        if (modalitiesError) throw modalitiesError
        setAcademicModalities(modalities || [])
      } catch (error) {
        console.error("Error al cargar catálogos:", error)
        notifications.error.load("catálogos de modalidades académicas")
      }
    }

    loadCatalogs()
  }, [supabase])

  const handleAddItem = (type: string) => {
    const newItems = [
      ...items,
      {
        id: "",
        education_type: type,
        institution: "",
        degree: "",
        field_of_study: "",
        level: "",
        graduation_date: null,
        start_date: "",
        end_date: null,
        current: false,
        semesters_completed: null,
        graduated: false,
        professional_card_number: null,
        description: "",
        institution_country: "Colombia",
        title_validated: false,
        ies_code: "",
        academic_modality: "",
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

      notifications.success.delete(`Educación ${index + 1}`)
    } catch (error) {
      console.error("Error al eliminar la educación:", error)
      notifications.error.delete("la educación")
    }
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
      const invalidItems = items.filter(item => {
        const basicValidation = !item.institution.trim() || 
          !item.degree.trim() || 
          !item.education_type.trim() ||
          !item.level.trim() ||
          (item.level === "OTHER" && !item.description?.trim())

        // Validación adicional para educación superior
        if (item.education_type === "higher") {
          return basicValidation || 
            !item.field_of_study?.trim() ||
            (!item.graduated && !item.current && !item.semesters_completed)
        }

        return basicValidation
      })
      
      if (invalidItems.length > 0) {
        const hasHigherEducation = invalidItems.some(item => item.education_type === "higher")
        const message = hasHigherEducation 
          ? "Para educación superior: por favor complete institución, título, área de estudio, nivel académico y estado de graduación"
          : "Por favor complete todos los campos obligatorios: institución, título, tipo de educación y nivel académico"
        
        notifications.error.validation(message)
        setLoading(false)
        return
      }

      // Obtener educaciones existentes para comparar
      const { data: existingEducations, error: fetchError } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)

      if (fetchError) throw fetchError

      // Preparar datos para upsert
      const educationData = items.map((item) => {
        // Buscar si ya existe una educación similar
        const existingItem = existingEducations?.find(existing => 
          existing.institution === item.institution &&
          existing.degree === item.degree &&
          existing.education_type === item.education_type
        )

        // Asegurarse de que los campos de fecha sean null si están vacíos
        const graduation_date = item.graduation_date || null
        const start_date = item.start_date || null
        const end_date = item.current ? null : item.end_date || null

        // Limpiar y validar datos antes del upsert
        const cleanData = {
          id: existingItem?.id || item.id || undefined, // Usar ID existente si lo hay
          user_id: userId,
          education_type: item.education_type,
          institution: item.institution.trim(),
          degree: item.degree.trim(),
          field_of_study: item.field_of_study?.trim() || null,
          level: item.level,
          graduation_date,
          start_date,
          end_date,
          current: Boolean(item.current),
          semesters_completed: item.semesters_completed ? Number(item.semesters_completed) : null,
          graduated: Boolean(item.graduated),
          professional_card_number: item.professional_card_number ? String(item.professional_card_number).trim() || null : null,
          description: item.description ? String(item.description).trim() || null : null,
          institution_country: item.institution_country || "Colombia",
          title_validated: Boolean(item.title_validated),
          ies_code: item.ies_code ? String(item.ies_code).trim() || null : null,
          academic_modality: item.academic_modality ? String(item.academic_modality).trim() || null : null,
        }

        // Eliminar campos undefined para evitar problemas con Supabase
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key as keyof typeof cleanData] === undefined) {
            delete cleanData[key as keyof typeof cleanData]
          }
        })

        return cleanData
      })

      console.log("Datos limpios para upsert:", educationData)

      // Separar inserts y updates para mejor control
      const insertsData = educationData.filter(item => !item.id)
      const updatesData = educationData.filter(item => item.id)

      console.log("Datos para insertar:", insertsData)
      console.log("Datos para actualizar:", updatesData)

      // Primero hacer inserts (sin ID)
      if (insertsData.length > 0) {
        const { error: insertError } = await supabase
          .from("education")
          .insert(insertsData)
        
        if (insertError) {
          console.error("Error en insert:", insertError)
          throw insertError
        }
      }

      // Luego hacer updates (con ID)
      if (updatesData.length > 0) {
        for (const updateItem of updatesData) {
          const { error: updateError } = await supabase
            .from("education")
            .update(updateItem)
            .eq("id", updateItem.id)
          
          if (updateError) {
            console.error("Error en update:", updateError)
            throw updateError
          }
        }
      }

      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ education_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      // Limpiar cache después de guardar exitosamente
      clearCache()
      
      // Refrescar datos de la base de datos
      refetchEducations()
      
      notifications.success.save("Información educativa")

      // Esperar un momento antes de refrescar para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("=== ERROR DETALLADO EN EDUCATION-FORM ===")
      console.error("Error completo:", error)
      console.error("Error message:", error.message)
      console.error("Error details:", error.details)
      console.error("Error code:", error.code)
      console.error("Error hint:", error.hint)
      console.error("Error stack:", error.stack)
      console.error("Error name:", error.name)
      console.error("Error toString:", error.toString())
      console.error("=== FIN ERROR DETALLADO ===")
      
      // Mostrar mensaje de error genérico hasta identificar el problema específico
      const errorMessage = "Error al guardar la información educativa. Verifica los logs de la consola."
      
      console.error("Mensaje de error para el usuario:", errorMessage)
      notifications.error.generic(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const basicEducationItems = items.filter((item) => item.education_type === "basic")
  const higherEducationItems = items.filter((item) => item.education_type === "higher")

  // Mostrar indicador de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formación Académica</CardTitle>
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
        <CardTitle>Formación Académica</CardTitle>
        <CardDescription>Agregue su información educativa completa</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="basic">Educación Básica y Media</TabsTrigger>
              <TabsTrigger value="higher">Educación Superior</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {basicEducationItems.map((item, index) => {
                const itemIndex = items.findIndex((i) => i === item)
                // Crear un identificador único para este documento específico
                const documentType = `education_basic_${index}`

                return (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Educación Básica/Media {index + 1}</h3>
                      {basicEducationItems.length > 1 && (
                        <DeleteConfirmation
                          onDelete={() => handleRemoveItem(itemIndex)}
                          itemName="registro de educación básica"
                          buttonSize="sm"
                          variant="ghost"
                          tableName="education"
                          itemId={item.id}
                          userId={userId}
                          documentKey={`${userId}/education_basic_${index}`}
                          onSuccess={() => {
                            notifications.success.delete(`Educación básica ${index + 1}`)
                          }}
                          onError={(error) => {
                            notifications.error.delete("educación básica", error.message)
                          }}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`grade-${index}`}>Último Grado Aprobado</Label>
                        <Select
                          value={item.level}
                          onValueChange={(value) => handleItemChange(itemIndex, "level", value)}
                          required
                        >
                          <SelectTrigger id={`grade-${index}`}>
                            <SelectValue placeholder="Seleccione un grado" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(11)].map((_, i) => (
                              <SelectItem key={i} value={`${i + 1}°`}>{`${i + 1}°`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`education-level-${index}`}>Nivel</Label>
                        <Select
                          value={item.field_of_study}
                          onValueChange={(value) => handleItemChange(itemIndex, "field_of_study", value)}
                          required
                        >
                          <SelectTrigger id={`education-level-${index}`}>
                            <SelectValue placeholder="Seleccione un nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primaria">Primaria</SelectItem>
                            <SelectItem value="Secundaria">Secundaria</SelectItem>
                            <SelectItem value="Media">Media</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`institution-${index}`}
                          label="Institución Educativa"
                          value={item.institution}
                          onChange={(e) => handleItemChange(itemIndex, "institution", e.target.value)}
                          validationRules={[validationRules.required, validationRules.text]}
                          sanitizer="text"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <ValidatedInput
                          id={`degree-${index}`}
                          label="Título Obtenido"
                          value={item.degree}
                          onChange={(e) => handleItemChange(itemIndex, "degree", e.target.value)}
                          validationRules={[validationRules.required, validationRules.text]}
                          sanitizer="text"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`institution-country-${index}`}
                          label="País de la Institución"
                          value={item.institution_country || "Colombia"}
                          onChange={(e) => handleItemChange(itemIndex, "institution_country", e.target.value)}
                          validationRules={[validationRules.required, validationRules.name]}
                          sanitizer="name"
                          required
                        />
                      </div>

                      <DatePicker
                        id={`graduation-date-${index}`}
                        label="Fecha de Grado"
                        value={item.graduation_date}
                        onChange={(date) => handleItemChange(itemIndex, "graduation_date", date)}
                        required
                        maxDate={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="space-y-4">
                      <AutoDocumentUpload
                        userId={userId}
                        documentType="basic_education_certificate"
                        formType="education"
                        itemIndex={index}
                        label="Certificado de Educación Básica/Media"
                        required
                        onUploadSuccess={(url: string) => {
                          console.log("Documento de educación básica subido exitosamente:", url)
                        }}
                        onUploadError={(error: string) => {
                          console.error("Error al subir documento de educación básica:", error)
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              <Button type="button" variant="outline" className="w-full" onClick={() => handleAddItem("basic")}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Educación Básica/Media
              </Button>

              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => setActiveTab("higher")}>
                  Siguiente: Educación Superior
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="higher" className="space-y-6">
              {higherEducationItems.map((item, index) => {
                const itemIndex = items.findIndex((i) => i === item)
                // Crear un identificador único para este documento específico
                const documentType = `education_higher_${index}`

                return (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Educación Superior {index + 1}</h3>
                      {higherEducationItems.length > 1 && (
                        <DeleteConfirmation
                          onDelete={() => handleRemoveItem(itemIndex)}
                          itemName="registro de educación superior"
                          buttonSize="sm"
                          variant="ghost"
                          tableName="education"
                          itemId={item.id}
                          userId={userId}
                          documentKey={`${userId}/education_higher_${index}`}
                          onSuccess={() => {
                            notifications.success.delete(`Educación superior ${index + 1}`)
                          }}
                          onError={(error) => {
                            notifications.error.delete("educación superior", error.message)
                          }}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`institution-higher-${index}`}
                          label="Institución Educativa"
                          value={item.institution}
                          onChange={(e) => handleItemChange(itemIndex, "institution", e.target.value)}
                          validationRules={[validationRules.required, validationRules.text]}
                          sanitizer="text"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <ValidatedInput
                          id={`ies-code-${index}`}
                          label="Código SNIES de la Institución"
                          value={item.ies_code || ""}
                          onChange={(e) => handleItemChange(itemIndex, "ies_code", e.target.value)}
                          validationRules={[validationRules.numbers]}
                          sanitizer="numbers"
                          type="number"
                          placeholder="Ej: 1101"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`institution-country-${index}`}
                          label="País de la Institución"
                          value={item.institution_country || "Colombia"}
                          onChange={(e) => handleItemChange(itemIndex, "institution_country", e.target.value)}
                          validationRules={[validationRules.required, validationRules.name]}
                          sanitizer="name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`modality-${index}`}>Modalidad Académica</Label>
                        <Select
                          value={item.academic_modality || ""}
                          onValueChange={(value) => handleItemChange(itemIndex, "academic_modality", value)}
                          required
                        >
                          <SelectTrigger id={`modality-${index}`}>
                            <SelectValue placeholder="Seleccione una modalidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicModalities.length > 0 ? (
                              academicModalities.map((modality) => (
                                <SelectItem key={modality.id} value={modality.id}>
                                  {modality.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="P">Presencial</SelectItem>
                                <SelectItem value="D">Distancia</SelectItem>
                                <SelectItem value="V">Virtual</SelectItem>
                                <SelectItem value="DU">Dual</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`level-${index}`}>Nivel Académico</Label>
                        <Select
                          value={item.level}
                          onValueChange={(value) => handleItemChange(itemIndex, "level", value)}
                          required
                        >
                          <SelectTrigger id={`level-${index}`}>
                            <SelectValue placeholder="Seleccione un nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TC">Técnica (TC)</SelectItem>
                            <SelectItem value="TL">Tecnológica (TL)</SelectItem>
                            <SelectItem value="TE">Tecnológica Especializada (TE)</SelectItem>
                            <SelectItem value="UN">Universitaria (UN)</SelectItem>
                            <SelectItem value="ES">Especialización (ES)</SelectItem>
                            <SelectItem value="MG">Maestría (MG)</SelectItem>
                            <SelectItem value="DOC">Doctorado (DOC)</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <ValidatedInput
                          id={`semesters-${index}`}
                          label="Número de Semestres Aprobados"
                          type="number"
                          min="0"
                          max="20"
                          value={item.semesters_completed || ""}
                          onChange={(e) =>
                            handleItemChange(itemIndex, "semesters_completed", Number.parseInt(e.target.value))
                          }
                          validationRules={[validationRules.required, validationRules.numbers]}
                          sanitizer="numbers"
                          required
                        />
                      </div>
                    </div>

                    {/* Campo condicional para "Otro" - Fuera del grid para que ocupe toda la fila */}
                    {item.level === "OTHER" && (
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`level-other-${index}`}
                          label="Especifique el nivel académico"
                          type="text"
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(itemIndex, "description", e.target.value)}
                          validationRules={[validationRules.required, validationRules.name]}
                          sanitizer="name"
                          required
                          placeholder="Ingrese el nivel académico"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`graduated-${index}`}>Graduado</Label>
                        <div className="flex items-center h-10 space-x-2">
                          <Checkbox
                            id={`graduated-${index}`}
                            checked={item.graduated}
                            onCheckedChange={(checked) => handleItemChange(itemIndex, "graduated", !!checked)}
                          />
                          <Label htmlFor={`graduated-${index}`}>Sí</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`title-validated-${index}`}>Título Convalidado</Label>
                        <div className="flex items-center h-10 space-x-2">
                          <Checkbox
                            id={`title-validated-${index}`}
                            checked={!!item.title_validated}
                            onCheckedChange={(checked) => handleItemChange(itemIndex, "title_validated", !!checked)}
                          />
                          <Label htmlFor={`title-validated-${index}`}>Sí</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`degree-higher-${index}`}
                          label="Título Obtenido"
                          value={item.degree}
                          onChange={(e) => handleItemChange(itemIndex, "degree", e.target.value)}
                          validationRules={[validationRules.required, validationRules.text]}
                          sanitizer="text"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <ValidatedInput
                          id={`field-${index}`}
                          label="Área de Estudio"
                          value={item.field_of_study}
                          onChange={(e) => handleItemChange(itemIndex, "field_of_study", e.target.value)}
                          validationRules={[validationRules.required, validationRules.text]}
                          sanitizer="text"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <DatePicker
                        id={`start-date-${index}`}
                        label="Fecha de Inicio"
                        value={item.start_date}
                        onChange={(date) => handleItemChange(itemIndex, "start_date", date)}
                        required
                        maxDate={new Date().toISOString().split("T")[0]}
                      />

                      <DatePicker
                        id={`graduation-date-higher-${index}`}
                        label="Fecha de Terminación"
                        value={item.graduation_date}
                        onChange={(date) => handleItemChange(itemIndex, "graduation_date", date)}
                        required
                        maxDate={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {item.graduated && (
                      <div className="space-y-2">
                        <ValidatedInput
                          id={`professional-card-${index}`}
                          label="Número de Tarjeta Profesional (si aplica)"
                          value={item.professional_card_number || ""}
                          onChange={(e) => handleItemChange(itemIndex, "professional_card_number", e.target.value)}
                          validationRules={[validationRules.alphanumeric]}
                          sanitizer="alphanumeric"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <AutoDocumentUpload
                        userId={userId}
                        documentType="higher_education_diploma"
                        formType="education"
                        itemIndex={index}
                        label="Diploma de Educación Superior"
                        required
                        onUploadSuccess={(url: string) => {
                          console.log("Documento de educación superior subido exitosamente:", url)
                        }}
                        onUploadError={(error: string) => {
                          console.error("Error al subir documento de educación superior:", error)
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              <Button type="button" variant="outline" className="w-full" onClick={() => handleAddItem("higher")}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Educación Superior
              </Button>

              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  Anterior: Educación Básica
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Formación Académica"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </form>
    </Card>
  )
}
