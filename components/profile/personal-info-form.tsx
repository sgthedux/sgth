"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ValidatedInput } from "@/components/ui/validated-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/profile/document-upload"
import { AutoDocumentUpload } from "@/components/profile/auto-document-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/date-picker"
import { validationRules } from "@/lib/validations"
import { useUser } from "@/hooks/use-user"
import { useFormCache } from "@/hooks/use-form-cache"
import { useDBData } from "@/hooks/use-db-data"
import { notifications, formMessages } from "@/lib/notifications"
import toast from "react-hot-toast"

interface Props {
  userId: string
  initialData?: {
    first_surname: string | null
    second_surname: string | null
    first_name: string | null
    middle_name: string | null
    identification_type: string | null
    identification_number: string | null
    document_issue_date: string | null
    document_issue_place: string | null
    gender: string | null
    nationality: string | null
    country: string | null
    marital_status: string | null
    military_booklet_type: string | null
    military_booklet_number: string | null
    military_district: string | null
    birth_date: string | null
    birth_country: string | null
    birth_state: string | null
    birth_city: string | null
    birth_municipality: string | null
    address: string | null
    institutional_address: string | null
    phone: string | null
    email: string | null
    institutional_email: string | null
    residence_country: string | null
    residence_state: string | null
    residence_city: string | null
    residence_municipality: string | null
  }
}

export function PersonalInfoForm({ userId, initialData }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("identification")
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({})

  // Memorizar initialData para evitar re-renders
  const stableInitialData = useMemo(() => initialData || {}, [JSON.stringify(initialData)])

  // Initialize form data structure with useMemo to prevent recreation
  const defaultFormData = useMemo(() => ({
    first_surname: "",
    second_surname: "",
    first_name: "",
    middle_name: "",
    identification_type: "",
    identification_number: "",
    document_issue_date: "",
    document_issue_place: "",
    gender: "",
    nationality: "Colombiana",
    country: "Colombia",
    marital_status: "",
    military_booklet_type: "",
    military_booklet_number: "",
    military_district: "",
    birth_date: "",
    birth_country: "Colombia",
    birth_state: "",
    birth_city: "",
    birth_municipality: "",
    address: "",
    institutional_address: "",
    phone: "",
    email: "",
    institutional_email: "",
    residence_country: "Colombia",
    residence_state: "",
    residence_city: "",
    residence_municipality: "",
    ...stableInitialData
  }), [stableInitialData])

  // Use form cache
  const { data: formData, updateData, isDirty, clearCache } = useFormCache(
    defaultFormData,
    {
      formKey: 'personal_info',
      userId: userId,
      autoSave: true,
      autoSaveDelay: 3000
    }
  )

  // Load existing data from database
  const { data: existingData, loading: loadingData } = useDBData<any>({
    userId,
    table: 'personal_info',
    enabled: !!userId
  })

  // Debug: Log data loading status
  useEffect(() => {
    console.log('🔍 Estado de carga de datos:', {
      userId,
      loadingData,
      existingDataLength: existingData?.length || 0,
      existingData: existingData?.[0] || null
    })
  }, [userId, loadingData, existingData])

  const supabase = createClient()

  // Load existing data when available
  useEffect(() => {
    if (existingData && existingData.length > 0) {
      const dbData = existingData[0]
      console.log('🔍 Datos cargados desde la base de datos:', dbData)
      console.log('📝 Datos actuales del formulario antes de la actualización:', formData)
      
      // Actualizar el formulario con los datos de la base de datos
      updateData(dbData)
      
      console.log('✅ Formulario actualizado con datos de la base de datos')
    } else {
      console.log('ℹ️ No hay datos existentes en la base de datos para este usuario')
    }
  }, [existingData, updateData])

  // Función para manejar cambios de validación
  const handleValidationChange = React.useCallback(
    (field: string) => (isValid: boolean, error: string | null) => {
      setValidationErrors((prev) => {
        if (prev[field] !== error) {
          return {
            ...prev,
            [field]: error,
          }
        }
        return prev
      })
    },
    [],
  )

  // Helper function to update form data
  const updateField = (field: string, value: any) => {
    updateData({
      ...formData,
      [field]: value
    })
  }

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // Usar valores por defecto para los catálogos
        setDocumentTypes([
          { id: "CC", name: "Cédula de Ciudadanía" },
          { id: "CE", name: "Cédula de Extranjería" },
          { id: "PAS", name: "Pasaporte" },
          { id: "TI", name: "Tarjeta de Identidad" },
        ])

        setMaritalStatusOptions([
          { id: "S", name: "Soltero/a" },
          { id: "C", name: "Casado/a" },
          { id: "U", name: "Unión Libre" },
          { id: "D", name: "Divorciado/a" },
          { id: "V", name: "Viudo/a" },
        ])
      } catch (error) {
        console.error("Error al cargar catálogos:", error)
      }
    }

    loadCatalogs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevenir múltiples envíos
    if (loading) return

    setLoading(true)

    try {
      const targetUserId = userId || user?.id
      if (!targetUserId) {
        notifications.error.validation("No se pudo identificar el usuario")
        setLoading(false)
        return
      }

      // Validar campos obligatorios usando formData
      if (!formData.first_surname?.trim() || !formData.first_name?.trim() || 
          !formData.identification_type || !formData.identification_number?.trim()) {
        notifications.error.validation("Por favor complete todos los campos obligatorios: primer apellido, primer nombre, tipo de documento y número de documento")
        setLoading(false)
        return
      }

      const personalInfoData = {
        user_id: targetUserId,
        ...formData
      }

      console.log("=== DEBUG PERSONAL INFO SAVE ===")
      console.log("targetUserId:", targetUserId)
      console.log("formData:", formData)
      console.log("personalInfoData:", personalInfoData)
      console.log("personalInfoData keys:", Object.keys(personalInfoData))
      console.log("=== END DEBUG ===")

      // Verificar si ya existe un registro para este usuario
      const { data: existingRecord, error: checkError } = await supabase
        .from("personal_info")
        .select("id")
        .eq("user_id", targetUserId)
        .maybeSingle()

      if (checkError) {
        console.error("Error al verificar registro existente:", checkError)
        throw checkError
      }

      let upsertError: any = null
      
      if (existingRecord) {
        // Actualizar registro existente
        const { error } = await supabase
          .from("personal_info")
          .update(personalInfoData)
          .eq("user_id", targetUserId)
        upsertError = error
      } else {
        // Insertar nuevo registro
        const { error } = await supabase
          .from("personal_info")
          .insert(personalInfoData)
        upsertError = error
      }

      if (upsertError) throw upsertError

      // Actualizar el perfil para marcar como completado
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ personal_info_completed: true })
        .eq("id", targetUserId)

      if (profileError) throw profileError      // Limpiar cache después de guardar exitosamente
      clearCache()

      // Mostrar mensaje de éxito
      notifications.success.save("Información personal")

      router.refresh()
    } catch (error: any) {
      console.error("Error al guardar información personal:", error)
      
      // Mostrar mensaje de error más amigable
      let errorMessage = "Ocurrió un error inesperado al guardar la información"
      
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Ya existe un registro con esta información"
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

  const nextTab = () => {
    if (activeTab === "identification") setActiveTab("military")
    else if (activeTab === "military") setActiveTab("contact")
  }

  const prevTab = () => {
    if (activeTab === "contact") setActiveTab("military")
    else if (activeTab === "military") setActiveTab("identification")
  }

  // Mostrar indicador de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
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
        <CardTitle>Datos Personales</CardTitle>
        <CardDescription>Ingrese su información personal completa</CardDescription>
        {/* Indicador de estado de datos */}
        {loadingData && (
          <div className="text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Cargando datos existentes...
          </div>
        )}
        {!loadingData && existingData && existingData.length > 0 && (
          <div className="text-sm text-green-600 flex items-center gap-2">
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            Datos cargados desde la base de datos
          </div>
        )}
        {!loadingData && (!existingData || existingData.length === 0) && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            No hay datos previos - Nuevo registro
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="identification">Identificación</TabsTrigger>
            <TabsTrigger value="military">Libreta Militar</TabsTrigger>
            <TabsTrigger value="contact">Nacimiento y Contacto</TabsTrigger>
          </TabsList>

          <TabsContent value="identification" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Personal</h3>
              <p className="text-sm text-blue-600 font-medium mb-4">Los campos con * son obligatorios</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValidatedInput
                  id="first-surname"
                  label="Primer Apellido"
                  value={formData.first_surname || ""}
                  onChange={(e) => updateField("first_surname", e.target.value)}
                  validationRules={[validationRules.required, validationRules.name]}
                  sanitizer="name"
                  required
                />

                <ValidatedInput
                  id="second-surname"
                  label="Segundo Apellido"
                  value={formData.second_surname || ""}
                  onChange={(e) => updateField("second_surname", e.target.value)}
                  validationRules={[validationRules.name]}
                  sanitizer="name"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValidatedInput
                  id="first-name"
                  label="Primer Nombre"
                  value={formData.first_name || ""}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  validationRules={[validationRules.required, validationRules.name]}
                  sanitizer="name"
                  required
                />

                <ValidatedInput
                  id="middle-name"
                  label="Segundo Nombre"
                  value={formData.middle_name || ""}
                  onChange={(e) => updateField("middle_name", e.target.value)}
                  validationRules={[validationRules.name]}
                  sanitizer="name"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">
                    Tipo de Documento
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.identification_type || ""} onValueChange={(value) => updateField("identification_type", value)} required>
                    <SelectTrigger className="border-2 border-input bg-background rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 shadow-sm">
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ValidatedInput
                  id="identification-number"
                  label="Número de Identificación"
                  value={formData.identification_number || ""}
                  onChange={(e) => updateField("identification_number", e.target.value)}
                  validationRules={[validationRules.required, validationRules.identification]}
                  sanitizer="identification"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">Fecha de Expedición</Label>
                  <DatePicker
                    id="document-issue-date"
                    label=""
                    value={formData.document_issue_date || ""}
                    onChange={(date) => updateField("document_issue_date", date || "")}
                    required
                    maxDate={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <ValidatedInput
                  id="document-issue-place"
                  label="Lugar de Expedición"
                  value={formData.document_issue_place || ""}
                  onChange={(e) => updateField("document_issue_place", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  required
                />
              </div>

              <div className="space-y-4">
                <AutoDocumentUpload
                  userId={userId}
                  documentType="identification_document"
                  formType="personal_info"
                  label="Documento de Identidad"
                  required
                  onUploadSuccess={(url) => {
                    console.log("Documento de identidad subido exitosamente:", url)
                  }}
                  onUploadError={(error) => {
                    console.error("Error al subir documento de identidad:", error)
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">Sexo</Label>
                  <RadioGroup value={formData.gender || ""} onValueChange={(value) => updateField("gender", value)} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        className="h-5 w-5 border-2 border-gray-400 text-blue-600"
                        value="F"
                        id="gender-f"
                      />
                      <Label htmlFor="gender-f">Femenino</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        className="h-5 w-5 border-2 border-gray-400 text-blue-600"
                        value="M"
                        id="gender-m"
                      />
                      <Label htmlFor="gender-m">Masculino</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">Estado Civil</Label>
                  <Select value={formData.marital_status || ""} onValueChange={(value) => updateField("marital_status", value)} required>
                    <SelectTrigger className="border-2 border-input bg-background rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 shadow-sm">
                      <SelectValue placeholder="Seleccione estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatusOptions.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">Nacionalidad</Label>
                  <RadioGroup value={formData.nationality || ""} onValueChange={(value) => updateField("nationality", value)} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        className="h-5 w-5 border-2 border-gray-400 text-blue-600"
                        value="Colombiana"
                        id="nationality-col"
                      />
                      <Label htmlFor="nationality-col">Colombiana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        className="h-5 w-5 border-2 border-gray-400 text-blue-600"
                        value="Extranjera"
                        id="nationality-ext"
                      />
                      <Label htmlFor="nationality-ext">Extranjera</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <ValidatedInput
                id="country"
                label="País"
                value={formData.country || ""}
                onChange={(e) => updateField("country", e.target.value)}
                validationRules={[validationRules.text]}
                sanitizer="text"
                onValidationChange={handleValidationChange("country")}
              />

              <div className="flex justify-end">
                <Button type="button" onClick={nextTab}>
                  Siguiente
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="military" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Libreta Militar</h3>
              <p className="text-sm text-muted-foreground">Complete esta sección si aplica para su caso</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">Tipo</Label>
                  <Select value={formData.military_booklet_type || ""} onValueChange={(value) => updateField("military_booklet_type", value)}>
                    <SelectTrigger className="border-2 border-input bg-background rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 shadow-sm">
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primera Clase">Primera Clase</SelectItem>
                      <SelectItem value="Segunda Clase">Segunda Clase</SelectItem>
                      <SelectItem value="No Aplica">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.military_booklet_type || "") !== "No Aplica" && (
                  <>
                    <ValidatedInput
                      id="military-booklet-number"
                      label="Número"
                      value={formData.military_booklet_number || ""}
                      onChange={(e) => updateField("military_booklet_number", e.target.value)}
                      validationRules={[validationRules.alphanumeric]}
                      sanitizer="alphanumeric"
                      onValidationChange={handleValidationChange("militaryBookletNumber")}
                    />

                    <ValidatedInput
                      id="military-district"
                      label="Distrito Militar (D.M)"
                      value={formData.military_district || ""}
                      onChange={(e) => updateField("military_district", e.target.value)}
                      validationRules={[validationRules.alphanumeric]}
                      sanitizer="alphanumeric"
                      onValidationChange={handleValidationChange("militaryDistrict")}
                    />
                  </>
                )}
              </div>

              {(formData.military_booklet_type || "") !== "No Aplica" && (
                <div className="space-y-4">
                  <AutoDocumentUpload
                    userId={userId}
                    documentType="military_booklet"
                    formType="personal_info"
                    label="Libreta Militar"
                    required
                    onUploadSuccess={(url) => {
                      console.log("Libreta militar subida exitosamente:", url)
                    }}
                    onUploadError={(error) => {
                      console.error("Error al subir libreta militar:", error)
                    }}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevTab}>
                  Anterior
                </Button>
                <Button type="button" onClick={nextTab}>
                  Siguiente
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nacimiento y Contacto</h3>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground">Fecha de Nacimiento</Label>
                <DatePicker
                  id="birth-date"
                  label=""
                  value={formData.birth_date || ""}
                  onChange={(date) => updateField("birth_date", date || "")}
                  required
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ValidatedInput
                  id="birth-country"
                  label="País de Nacimiento"
                  value={formData.birth_country || ""}
                  onChange={(e) => updateField("birth_country", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthCountry")}
                  required
                />

                <ValidatedInput
                  id="birth-state"
                  label="Departamento de Nacimiento"
                  value={formData.birth_state ?? ""}
                  onChange={(e) => updateField("birth_state", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthState")}
                  required
                />

                <ValidatedInput
                  id="birth-city"
                  label="Municipio de Nacimiento"
                  value={formData.birth_city ?? ""}
                  onChange={(e) => updateField("birth_city", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthCity")}
                  required
                />
              </div>

              <ValidatedInput
                id="birth-municipality"
                label="Código DANE Municipio de Nacimiento"
                value={formData.birth_municipality ?? ""}
                onChange={(e) => updateField("birth_municipality", e.target.value)}
                validationRules={[validationRules.numbers]}
                sanitizer="numbers"
                onValidationChange={handleValidationChange("birthMunicipality")}
                placeholder="Ej. 11001 para Bogotá"
              />

              <Separator className="my-4" />

              <ValidatedInput
                id="address"
                label="Dirección Personal"
                value={formData.address ?? ""}
                onChange={(e) => updateField("address", e.target.value)}
                validationRules={[validationRules.required, validationRules.text]}
                sanitizer="text"
                onValidationChange={handleValidationChange("address")}
                required
              />

              <ValidatedInput
                id="institutional-address"
                label="Dirección Institucional"
                value={formData.institutional_address ?? ""}
                onChange={(e) => updateField("institutional_address", e.target.value)}
                validationRules={[validationRules.text]}
                sanitizer="text"
                onValidationChange={handleValidationChange("institutionalAddress")}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValidatedInput
                  id="phone"
                  label="Teléfono"
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  validationRules={[validationRules.required, validationRules.phone]}
                  onValidationChange={handleValidationChange("phone")}
                  required
                />

                <ValidatedInput
                  id="email"
                  label="Correo Electrónico Personal"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  validationRules={[validationRules.required, validationRules.email]}
                  onValidationChange={handleValidationChange("email")}
                  required
                />
              </div>

              <ValidatedInput
                id="institutional-email"
                label="Correo Electrónico Institucional"
                type="email"
                value={formData.institutional_email ?? ""}
                onChange={(e) => updateField("institutional_email", e.target.value)}
                validationRules={[validationRules.email]}
                onValidationChange={handleValidationChange("institutionalEmail")}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ValidatedInput
                  id="residence-country"
                  label="País de Residencia"
                  value={formData.residence_country ?? ""}
                  onChange={(e) => updateField("residence_country", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceCountry")}
                  required
                />

                <ValidatedInput
                  id="residence-state"
                  label="Departamento de Residencia"
                  value={formData.residence_state ?? ""}
                  onChange={(e) => updateField("residence_state", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceState")}
                  required
                />

                <ValidatedInput
                  id="residence-city"
                  label="Municipio de Residencia"
                  value={formData.residence_city ?? ""}
                  onChange={(e) => updateField("residence_city", e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceCity")}
                  required
                />
              </div>

              <ValidatedInput
                id="residence-municipality"
                label="Código DANE Municipio de Residencia"
                value={formData.residence_municipality ?? ""}
                onChange={(e) => updateField("residence_municipality", e.target.value)}
                validationRules={[validationRules.numbers]}
                sanitizer="numbers"
                onValidationChange={handleValidationChange("residenceMunicipality")}
                placeholder="Ej. 11001 para Bogotá"
              />

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevTab}>
                  Anterior
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Información Personal"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

