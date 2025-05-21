"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/profile/document-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/date-picker"
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("identification")
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<any>(null)

  // Identification data
  const [firstSurname, setFirstSurname] = useState<string>("")
  const [secondSurname, setSecondSurname] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [middleName, setMiddleName] = useState<string>("")
  const [identificationType, setIdentificationType] = useState<string>("")
  const [identificationNumber, setIdentificationNumber] = useState<string>("")
  const [documentIssueDate, setDocumentIssueDate] = useState<string>("")
  const [documentIssuePlace, setDocumentIssuePlace] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [maritalStatus, setMaritalStatus] = useState<string>("")
  const [nationality, setNationality] = useState<string>("")
  const [country, setCountry] = useState<string>("")

  // Military service data
  const [militaryBookletType, setMilitaryBookletType] = useState<string>("")
  const [militaryBookletNumber, setMilitaryBookletNumber] = useState<string>("")
  const [militaryDistrict, setMilitaryDistrict] = useState<string>("")

  // Birth and contact data
  const [birthDate, setBirthDate] = useState<string>("")
  const [birthCountry, setBirthCountry] = useState<string>("")
  const [birthState, setBirthState] = useState<string>("")
  const [birthCity, setBirthCity] = useState<string>("")
  const [birthMunicipality, setBirthMunicipality] = useState<string>("")
  const [address, setAddress] = useState<string>("")
  const [institutionalAddress, setInstitutionalAddress] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [institutionalEmail, setInstitutionalEmail] = useState<string>("")
  const [residenceCountry, setResidenceCountry] = useState<string>("")
  const [residenceState, setResidenceState] = useState<string>("")
  const [residenceCity, setResidenceCity] = useState<string>("")
  const [residenceMunicipality, setResidenceMunicipality] = useState<string>("")

  const router = useRouter()
  const supabase = createClient()

  // Función para obtener los datos actuales del formulario
  const getCurrentFormData = useCallback(() => {
    return {
      user_id: userId,
      first_surname: firstSurname,
      second_surname: secondSurname,
      first_name: firstName,
      middle_name: middleName,
      identification_type: identificationType,
      identification_number: identificationNumber,
      document_issue_date: documentIssueDate,
      document_issue_place: documentIssuePlace,
      gender,
      marital_status: maritalStatus,
      nationality,
      country,
      military_booklet_type: militaryBookletType,
      military_booklet_number: militaryBookletNumber,
      military_district: militaryDistrict,
      birth_date: birthDate,
      birth_country: birthCountry,
      birth_state: birthState,
      birth_city: birthCity,
      birth_municipality: birthMunicipality,
      address,
      institutional_address: institutionalAddress,
      phone,
      email,
      institutional_email: institutionalEmail,
      residence_country: residenceCountry,
      residence_state: residenceState,
      residence_city: residenceCity,
      residence_municipality: residenceMunicipality,
    }
  }, [
    userId,
    firstSurname,
    secondSurname,
    firstName,
    middleName,
    identificationType,
    identificationNumber,
    documentIssueDate,
    documentIssuePlace,
    gender,
    maritalStatus,
    nationality,
    country,
    militaryBookletType,
    militaryBookletNumber,
    militaryDistrict,
    birthDate,
    birthCountry,
    birthState,
    birthCity,
    birthMunicipality,
    address,
    institutionalAddress,
    phone,
    email,
    institutionalEmail,
    residenceCountry,
    residenceState,
    residenceCity,
    residenceMunicipality,
  ])

  // Función para guardar automáticamente
  const autoSave = useCallback(async () => {
    if (!userId) return

    const currentData = getCurrentFormData()

    // Verificar si hay cambios comparando con los últimos datos guardados
    if (lastSavedDataRef.current && JSON.stringify(lastSavedDataRef.current) === JSON.stringify(currentData)) {
      return // No hay cambios, no es necesario guardar
    }

    setAutoSaveStatus("saving")

    try {
      const { data: existingData, error: fetchError } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError && !fetchError.message.includes("No rows found")) {
        throw fetchError
      }

      let error

      if (existingData) {
        const { error: updateError } = await supabase.from("personal_info").update(currentData).eq("user_id", userId)

        error = updateError
      } else {
        const { error: insertError } = await supabase.from("personal_info").insert(currentData)

        error = insertError
      }

      if (error) throw error

      // Actualizar referencia de datos guardados
      lastSavedDataRef.current = { ...currentData }
      setHasUnsavedChanges(false)
      setAutoSaveStatus("saved")

      // Resetear el estado después de 3 segundos
      setTimeout(() => {
        setAutoSaveStatus("idle")
      }, 3000)
    } catch (error: any) {
      console.error("Error en autoguardado:", error)
      setAutoSaveStatus("error")
    }
  }, [getCurrentFormData, supabase, userId])

  // Configurar el guardado automático cuando cambian los datos
  useEffect(() => {
    // Marcar que hay cambios sin guardar
    if (lastSavedDataRef.current) {
      setHasUnsavedChanges(true)
    }

    // Limpiar el timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Configurar un nuevo timeout para guardar después de 2 segundos de inactividad
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        autoSave()
      }
    }, 2000)

    // Limpiar el timeout cuando el componente se desmonte
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [
    firstSurname,
    secondSurname,
    firstName,
    middleName,
    identificationType,
    identificationNumber,
    documentIssueDate,
    documentIssuePlace,
    gender,
    maritalStatus,
    nationality,
    country,
    militaryBookletType,
    militaryBookletNumber,
    militaryDistrict,
    birthDate,
    birthCountry,
    birthState,
    birthCity,
    birthMunicipality,
    address,
    institutionalAddress,
    phone,
    email,
    institutionalEmail,
    residenceCountry,
    residenceState,
    residenceCity,
    residenceMunicipality,
    autoSave,
    hasUnsavedChanges,
  ])

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // Cargar tipos de documento
        const { data: docTypes, error: docTypesError } = await supabase
          .from("document_types")
          .select("id, name")
          .order("name")

        if (docTypesError) {
          console.error("Error al cargar tipos de documento:", docTypesError)
          // Si hay error, usamos valores por defecto
          setDocumentTypes([
            { id: "CC", name: "Cédula de Ciudadanía" },
            { id: "CE", name: "Cédula de Extranjería" },
            { id: "PAS", name: "Pasaporte" },
            { id: "TI", name: "Tarjeta de Identidad" },
          ])
        } else {
          setDocumentTypes(docTypes || [])
        }

        // Cargar estados civiles
        const { data: maritalStatuses, error: maritalStatusError } = await supabase
          .from("marital_status")
          .select("id, name")
          .order("name")

        if (maritalStatusError) {
          console.error("Error al cargar estados civiles:", maritalStatusError)
          // Si hay error, usamos valores por defecto
          setMaritalStatusOptions([
            { id: "S", name: "Soltero/a" },
            { id: "C", name: "Casado/a" },
            { id: "U", name: "Unión Libre" },
            { id: "D", name: "Divorciado/a" },
            { id: "V", name: "Viudo/a" },
          ])
        } else {
          setMaritalStatusOptions(maritalStatuses || [])
        }
      } catch (error) {
        console.error("Error al cargar catálogos:", error)
      }
    }

    loadCatalogs()
  }, [supabase])

  // Cargar datos iniciales cuando el componente se monta o cuando initialData cambia
  useEffect(() => {
    if (initialData) {
      console.log("Cargando datos iniciales:", initialData)

      // Identification data
      setFirstSurname(initialData.first_surname || "")
      setSecondSurname(initialData.second_surname || "")
      setFirstName(initialData.first_name || "")
      setMiddleName(initialData.middle_name || "")
      setIdentificationType(initialData.identification_type || "")
      setIdentificationNumber(initialData.identification_number || "")
      setDocumentIssueDate(initialData.document_issue_date || "")
      setDocumentIssuePlace(initialData.document_issue_place || "")
      setGender(initialData.gender || "")
      setMaritalStatus(initialData.marital_status || "")
      setNationality(initialData.nationality || "")
      setCountry(initialData.country || "")

      // Military service data
      setMilitaryBookletType(initialData.military_booklet_type || "")
      setMilitaryBookletNumber(initialData.military_booklet_number || "")
      setMilitaryDistrict(initialData.military_district || "")

      // Birth and contact data
      setBirthDate(initialData.birth_date || "")
      setBirthCountry(initialData.birth_country || "")
      setBirthState(initialData.birth_state || "")
      setBirthCity(initialData.birth_city || "")
      setBirthMunicipality(initialData.birth_municipality || "")
      setAddress(initialData.address || "")
      setInstitutionalAddress(initialData.institutional_address || "")
      setPhone(initialData.phone || "")
      setEmail(initialData.email || "")
      setInstitutionalEmail(initialData.institutional_email || "")
      setResidenceCountry(initialData.residence_country || "")
      setResidenceState(initialData.residence_state || "")
      setResidenceCity(initialData.residence_city || "")
      setResidenceMunicipality(initialData.residence_municipality || "")

      // Guardar los datos iniciales como referencia
      lastSavedDataRef.current = {
        user_id: userId,
        first_surname: initialData.first_surname || "",
        second_surname: initialData.second_surname || "",
        first_name: initialData.first_name || "",
        middle_name: initialData.middle_name || "",
        identification_type: initialData.identification_type || "",
        identification_number: initialData.identification_number || "",
        document_issue_date: initialData.document_issue_date || "",
        document_issue_place: initialData.document_issue_place || "",
        gender: initialData.gender || "",
        marital_status: initialData.marital_status || "",
        nationality: initialData.nationality || "",
        country: initialData.country || "",
        military_booklet_type: initialData.military_booklet_type || "",
        military_booklet_number: initialData.military_booklet_number || "",
        military_district: initialData.military_district || "",
        birth_date: initialData.birth_date || "",
        birth_country: initialData.birth_country || "",
        birth_state: initialData.birth_state || "",
        birth_city: initialData.birth_city || "",
        birth_municipality: initialData.birth_municipality || "",
        address: initialData.address || "",
        institutional_address: initialData.institutional_address || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        institutional_email: initialData.institutional_email || "",
        residence_country: initialData.residence_country || "",
        residence_state: initialData.residence_state || "",
        residence_city: initialData.residence_city || "",
        residence_municipality: initialData.residence_municipality || "",
      }
    }
  }, [initialData, userId])

  // Función modificada para cambiar de pestaña con verificación de cambios sin guardar
  const changeTab = (newTab: string) => {
    if (hasUnsavedChanges && autoSaveStatus !== "saving") {
      // Si hay cambios sin guardar, mostrar diálogo de confirmación
      setPendingTabChange(newTab)
      setShowUnsavedChangesDialog(true)
    } else {
      // Si no hay cambios o se está guardando automáticamente, cambiar directamente
      setActiveTab(newTab)
    }
  }

  const nextTab = () => {
    if (activeTab === "identification") changeTab("military")
    else if (activeTab === "military") changeTab("contact")
  }

  const prevTab = () => {
    if (activeTab === "contact") changeTab("military")
    else if (activeTab === "military") changeTab("identification")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: existingData, error: fetchError } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError && !fetchError.message.includes("No rows found")) {
        throw fetchError
      }

      const personalInfoData = {
        user_id: userId,
        first_surname: firstSurname,
        second_surname: secondSurname,
        first_name: firstName,
        middle_name: middleName,
        identification_type: identificationType,
        identification_number: identificationNumber,
        document_issue_date: documentIssueDate,
        document_issue_place: documentIssuePlace,
        gender,
        marital_status: maritalStatus,
        nationality,
        country,
        military_booklet_type: militaryBookletType,
        military_booklet_number: militaryBookletNumber,
        military_district: militaryDistrict,
        birth_date: birthDate,
        birth_country: birthCountry,
        birth_state: birthState,
        birth_city: birthCity,
        birth_municipality: birthMunicipality,
        address,
        institutional_address: institutionalAddress,
        phone,
        email,
        institutional_email: institutionalEmail,
        residence_country: residenceCountry,
        residence_state: residenceState,
        residence_city: residenceCity,
        residence_municipality: residenceMunicipality,
      }

      let error

      if (existingData) {
        const { error: updateError } = await supabase
          .from("personal_info")
          .update(personalInfoData)
          .eq("user_id", userId)

        error = updateError
      } else {
        const { error: insertError } = await supabase.from("personal_info").insert(personalInfoData)

        error = insertError
      }

      if (error) throw error

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ personal_info_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      // Actualizar referencia de datos guardados
      lastSavedDataRef.current = getCurrentFormData()
      setHasUnsavedChanges(false)

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error al guardar la información personal")
    } finally {
      setLoading(false)
    }
  }

  // Renderizar indicador de estado de guardado automático
  const renderAutoSaveStatus = () => {
    switch (autoSaveStatus) {
      case "saving":
        return (
          <div className="text-xs text-blue-600 flex items-center">
            <div className="animate-spin mr-1 h-3 w-3 border-2 border-blue-600 rounded-full border-t-transparent"></div>
            Guardando...
          </div>
        )
      case "saved":
        return <div className="text-xs text-green-600">Guardado automático completado</div>
      case "error":
        return <div className="text-xs text-red-600">Error al guardar automáticamente</div>
      default:
        return hasUnsavedChanges ? <div className="text-xs text-amber-600">Cambios sin guardar</div> : null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Datos Personales</CardTitle>
            <CardDescription>Ingrese su información personal completa</CardDescription>
          </div>
          {renderAutoSaveStatus()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
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
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="first-surname">
                    Primer Apellido
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="first-surname"
                    value={firstSurname}
                    onChange={(e) => setFirstSurname(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="second-surname">
                    Segundo Apellido
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="second-surname"
                    value={secondSurname}
                    onChange={(e) => setSecondSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="first-name">
                    Primer Nombre
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="middle-name">
                    Segundo Nombre
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="middle-name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="identification-type">
                    Tipo de Documento
                  </Label>
                  <Select
                    className="border-2 rounded-md shadow-sm"
                    value={identificationType}
                    onValueChange={setIdentificationType}
                    required
                  >
                    <SelectTrigger
                      className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                      id="identification-type"
                    >
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.length > 0 ? (
                        documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="CC">Cédula de Ciudadanía (CC)</SelectItem>
                          <SelectItem value="CE">Cédula de Extranjería (CE)</SelectItem>
                          <SelectItem value="PAS">Pasaporte (PAS)</SelectItem>
                          <SelectItem value="TI">Tarjeta de Identidad (TI)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="identification-number">
                    Número de Identificación
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="identification-number"
                    value={identificationNumber}
                    onChange={(e) => setIdentificationNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="document-issue-date">
                    Fecha de Expedición
                  </Label>
                  <DatePicker
                    id="document-issue-date"
                    value={documentIssueDate}
                    onChange={setDocumentIssueDate}
                    required
                    maxDate={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="document-issue-place">
                    Lugar de Expedición
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="document-issue-place"
                    value={documentIssuePlace}
                    onChange={(e) => setDocumentIssuePlace(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <DocumentUpload userId={userId} documentType="identification" label="Subir documento de identidad" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="gender">
                    Sexo
                  </Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
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
                  <Label className="text-base font-semibold text-gray-700" htmlFor="marital-status">
                    Estado Civil
                  </Label>
                  <Select
                    className="border-2 rounded-md shadow-sm"
                    value={maritalStatus}
                    onValueChange={setMaritalStatus}
                    required
                  >
                    <SelectTrigger
                      className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                      id="marital-status"
                    >
                      <SelectValue placeholder="Seleccione estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatusOptions.length > 0 ? (
                        maritalStatusOptions.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="S">Soltero/a</SelectItem>
                          <SelectItem value="C">Casado/a</SelectItem>
                          <SelectItem value="U">Unión Libre</SelectItem>
                          <SelectItem value="D">Divorciado/a</SelectItem>
                          <SelectItem value="V">Viudo/a</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="nationality">
                    Nacionalidad
                  </Label>
                  <RadioGroup value={nationality} onValueChange={setNationality} className="flex space-x-4">
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

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="country">
                  País
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

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
                  <Label className="text-base font-semibold text-gray-700" htmlFor="military-booklet-type">
                    Tipo
                  </Label>
                  <Select
                    className="border-2 rounded-md shadow-sm"
                    value={militaryBookletType}
                    onValueChange={setMilitaryBookletType}
                  >
                    <SelectTrigger
                      className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                      id="military-booklet-type"
                    >
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primera Clase">Primera Clase</SelectItem>
                      <SelectItem value="Segunda Clase">Segunda Clase</SelectItem>
                      <SelectItem value="No Aplica">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {militaryBookletType !== "No Aplica" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-gray-700" htmlFor="military-booklet-number">
                        Número
                      </Label>
                      <Input
                        className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                        id="military-booklet-number"
                        value={militaryBookletNumber}
                        onChange={(e) => setMilitaryBookletNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-gray-700" htmlFor="military-district">
                        Distrito Militar (D.M)
                      </Label>
                      <Input
                        className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                        id="military-district"
                        value={militaryDistrict}
                        onChange={(e) => setMilitaryDistrict(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {militaryBookletType !== "No Aplica" && (
                <div className="space-y-4">
                  <DocumentUpload userId={userId} documentType="military_booklet" label="Subir libreta militar" />
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

              <DatePicker
                id="birth-date"
                label="Fecha de Nacimiento"
                value={birthDate}
                onChange={setBirthDate}
                required
                maxDate={new Date().toISOString().split("T")[0]}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="birth-country">
                    País de Nacimiento
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="birth-country"
                    value={birthCountry}
                    onChange={(e) => setBirthCountry(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="birth-state">
                    Departamento de Nacimiento
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="birth-state"
                    value={birthState}
                    onChange={(e) => setBirthState(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="birth-city">
                    Municipio de Nacimiento
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="birth-city"
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="birth-municipality">
                  Código DANE Municipio de Nacimiento
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="birth-municipality"
                  value={birthMunicipality}
                  onChange={(e) => setBirthMunicipality(e.target.value)}
                  placeholder="Ej. 11001 para Bogotá"
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="address">
                  Dirección Personal
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="institutional-address">
                  Dirección Institucional
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="institutional-address"
                  value={institutionalAddress}
                  onChange={(e) => setInstitutionalAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="phone">
                    Teléfono
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="email">
                    Correo Electrónico Personal
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="institutional-email">
                  Correo Electrónico Institucional
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="institutional-email"
                  type="email"
                  value={institutionalEmail}
                  onChange={(e) => setInstitutionalEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="residence-country">
                    País de Residencia
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="residence-country"
                    value={residenceCountry}
                    onChange={(e) => setResidenceCountry(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="residence-state">
                    Departamento de Residencia
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="residence-state"
                    value={residenceState}
                    onChange={(e) => setResidenceState(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700" htmlFor="residence-city">
                    Municipio de Residencia
                  </Label>
                  <Input
                    className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                    id="residence-city"
                    value={residenceCity}
                    onChange={(e) => setResidenceCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700" htmlFor="residence-municipality">
                  Código DANE Municipio de Residencia
                </Label>
                <Input
                  className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  id="residence-municipality"
                  value={residenceMunicipality}
                  onChange={(e) => setResidenceMunicipality(e.target.value)}
                  placeholder="Ej. 11001 para Bogotá"
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevTab}>
                  Anterior
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Información Personal"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Quieres guardarlos antes de cambiar de sección?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                autoSave().then(() => {
                  if (pendingTabChange) {
                    setActiveTab(pendingTabChange)
                    setPendingTabChange(null)
                  }
                  setShowUnsavedChangesDialog(false)
                })
              }}
            >
              Guardar y continuar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setHasUnsavedChanges(false)
                if (pendingTabChange) {
                  setActiveTab(pendingTabChange)
                  setPendingTabChange(null)
                }
                setShowUnsavedChangesDialog(false)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continuar sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
