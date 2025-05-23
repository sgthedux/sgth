"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Plus, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/profile/document-upload"
import { DatePicker } from "@/components/date-picker"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [items, setItems] = useState(
    educations.length > 0
      ? educations
      : [
          {
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
          },
        ],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [academicModalities, setAcademicModalities] = useState<any[]>([])
  const supabase = createClient()

  // Estados para el guardado automático
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null)
  const originalItemsRef = useRef<typeof items>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      }
    }

    loadCatalogs()
  }, [supabase])

  const handleAddItem = (type: string) => {
    setItems([
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
    ])
  }

  const handleRemoveItem = async (index: number) => {
    try {
      // Eliminar el elemento del estado local
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)

      setSuccessMessage(`Educación ${index + 1} eliminada correctamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar la educación:", error)
      setError("Error al eliminar la educación. Inténtelo de nuevo.")
      setTimeout(() => setError(null), 3000)
    }
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
        // Delete existing education records
        if (educations.length > 0) {
          const { error: deleteError } = await supabase.from("education").delete().eq("user_id", userId)
          if (deleteError) throw deleteError
        }

        // Insert new education records
        const educationData = dataToSave.map((item) => {
          // Asegurarse de que los campos de fecha sean null si están vacíos
          const graduation_date = item.graduation_date || null
          const start_date = item.start_date || null
          const end_date = item.current ? null : item.end_date || null

          return {
            user_id: userId,
            education_type: item.education_type,
            institution: item.institution,
            degree: item.degree,
            field_of_study: item.field_of_study,
            level: item.level,
            graduation_date,
            start_date,
            end_date,
            current: item.current,
            semesters_completed: item.semesters_completed,
            graduated: item.graduated,
            professional_card_number: item.professional_card_number,
            description: item.description,
            institution_country: item.institution_country,
            title_validated: item.title_validated,
            ies_code: item.ies_code,
            academic_modality: item.academic_modality,
          }
        })

        const { data: insertedEducations, error: insertError } = await supabase
          .from("education")
          .insert(educationData)
          .select()

        if (insertError) throw insertError

        // Update profile status
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ education_completed: true })
          .eq("id", userId)

        if (profileError) throw profileError

        // Actualizar el estado después de guardar
        setHasUnsavedChanges(false)
        setSaveStatus("saved")
        originalItemsRef.current = JSON.parse(JSON.stringify(dataToSave))

        // Mostrar mensaje de éxito brevemente
        setSuccessMessage("Información educativa guardada automáticamente")
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
    [hasUnsavedChanges, items, educations.length, supabase, userId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setSaveStatus("saving")

    try {
      // Delete existing education records
      if (educations.length > 0) {
        const { error: deleteError } = await supabase.from("education").delete().eq("user_id", userId)
        if (deleteError) throw deleteError
      }

      // Insert new education records
      const educationData = items.map((item) => {
        // Asegurarse de que los campos de fecha sean null si están vacíos
        const graduation_date = item.graduation_date || null
        const start_date = item.start_date || null
        const end_date = item.current ? null : item.end_date || null

        return {
          user_id: userId,
          education_type: item.education_type,
          institution: item.institution,
          degree: item.degree,
          field_of_study: item.field_of_study,
          level: item.level,
          graduation_date,
          start_date,
          end_date,
          current: item.current,
          semesters_completed: item.semesters_completed,
          graduated: item.graduated,
          professional_card_number: item.professional_card_number,
          description: item.description,
          institution_country: item.institution_country,
          title_validated: item.title_validated,
          ies_code: item.ies_code,
          academic_modality: item.academic_modality,
        }
      })

      const { data: insertedEducations, error: insertError } = await supabase
        .from("education")
        .insert(educationData)
        .select()

      if (insertError) throw insertError

      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ education_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      setSuccessMessage("Información educativa guardada correctamente")
      setHasUnsavedChanges(false)
      setSaveStatus("saved")
      originalItemsRef.current = JSON.parse(JSON.stringify(items))

      // Esperar un momento antes de refrescar para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Error al guardar la información educativa")
      setSaveStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      setPendingTabChange(value)
      setShowUnsavedDialog(true)
    } else {
      setActiveTab(value)
    }
  }

  const confirmTabChange = () => {
    if (pendingTabChange) {
      setActiveTab(pendingTabChange)
      setPendingTabChange(null)
    }
    setShowUnsavedDialog(false)
  }

  const saveAndContinue = async () => {
    await autoSave()
    confirmTabChange()
  }

  // Inicializar el estado original para comparar cambios
  useEffect(() => {
    originalItemsRef.current = JSON.parse(JSON.stringify(items))
  }, [])

  const basicEducationItems = items.filter((item) => item.education_type === "basic")
  const higherEducationItems = items.filter((item) => item.education_type === "higher")

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Formación Académica</CardTitle>
            <CardDescription>Agregue su información educativa completa</CardDescription>
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

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                            setSuccessMessage(`Educación básica ${index + 1} eliminada correctamente`)
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
                        <Label htmlFor={`institution-${index}`}>Institución Educativa</Label>
                        <Input
                          id={`institution-${index}`}
                          value={item.institution}
                          onChange={(e) => handleItemChange(itemIndex, "institution", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`degree-${index}`}>Título Obtenido</Label>
                        <Input
                          id={`degree-${index}`}
                          value={item.degree}
                          onChange={(e) => handleItemChange(itemIndex, "degree", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`institution-country-${index}`}>País de la Institución</Label>
                        <Input
                          id={`institution-country-${index}`}
                          value={item.institution_country || "Colombia"}
                          onChange={(e) => handleItemChange(itemIndex, "institution_country", e.target.value)}
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
                      <Label>Documento de Soporte</Label>
                      <DocumentUpload
                        userId={userId}
                        documentType={documentType}
                        itemId={`basic_${index}`}
                        label="Subir diploma o certificado de educación básica"
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
                            setSuccessMessage(`Educación superior ${index + 1} eliminada correctamente`)
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
                        <Label htmlFor={`institution-higher-${index}`}>Institución Educativa</Label>
                        <Input
                          id={`institution-higher-${index}`}
                          value={item.institution}
                          onChange={(e) => handleItemChange(itemIndex, "institution", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`ies-code-${index}`}>Código SNIES de la Institución</Label>
                        <Input
                          id={`ies-code-${index}`}
                          value={item.ies_code || ""}
                          onChange={(e) => handleItemChange(itemIndex, "ies_code", e.target.value)}
                          placeholder="Ej: 1101"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`institution-country-${index}`}>País de la Institución</Label>
                        <Input
                          id={`institution-country-${index}`}
                          value={item.institution_country || "Colombia"}
                          onChange={(e) => handleItemChange(itemIndex, "institution_country", e.target.value)}
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`semesters-${index}`}>Número de Semestres Aprobados</Label>
                        <Input
                          id={`semesters-${index}`}
                          type="number"
                          min="0"
                          max="20"
                          value={item.semesters_completed || ""}
                          onChange={(e) =>
                            handleItemChange(itemIndex, "semesters_completed", Number.parseInt(e.target.value))
                          }
                          required
                        />
                      </div>
                    </div>

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
                            checked={item.title_validated}
                            onCheckedChange={(checked) => handleItemChange(itemIndex, "title_validated", !!checked)}
                          />
                          <Label htmlFor={`title-validated-${index}`}>Sí</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`degree-higher-${index}`}>Título Obtenido</Label>
                        <Input
                          id={`degree-higher-${index}`}
                          value={item.degree}
                          onChange={(e) => handleItemChange(itemIndex, "degree", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`field-${index}`}>Área de Estudio</Label>
                        <Input
                          id={`field-${index}`}
                          value={item.field_of_study}
                          onChange={(e) => handleItemChange(itemIndex, "field_of_study", e.target.value)}
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
                        <Label htmlFor={`professional-card-${index}`}>Número de Tarjeta Profesional (si aplica)</Label>
                        <Input
                          id={`professional-card-${index}`}
                          value={item.professional_card_number || ""}
                          onChange={(e) => handleItemChange(itemIndex, "professional_card_number", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label>Documento de Soporte</Label>
                      <DocumentUpload
                        userId={userId}
                        documentType={documentType}
                        itemId={`higher_${index}`}
                        label="Subir diploma o certificado de educación superior"
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
      {/* Diálogo de confirmación para cambios sin guardar */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>Tienes cambios sin guardar. ¿Qué deseas hacer?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveAndContinue} className="bg-green-600 hover:bg-green-700">
              Guardar y continuar
            </AlertDialogAction>
            <AlertDialogAction onClick={confirmTabChange}>Continuar sin guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
