"use client"

import React from "react"

import { useState, useEffect } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/date-picker"
import { validationRules } from "@/lib/validations"
import { useUser } from "@/hooks/use-user"

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
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("identification")
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({})

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

  // Verificar si el formulario es válido
  const isFormValid = React.useMemo(() => {
    const requiredFields = ["firstSurname", "firstName", "identificationType", "identificationNumber"]
    const hasRequiredFields = requiredFields.every((field) => {
      switch (field) {
        case "firstSurname":
          return firstSurname.trim() !== ""
        case "firstName":
          return firstName.trim() !== ""
        case "identificationType":
          return identificationType !== ""
        case "identificationNumber":
          return identificationNumber.trim() !== ""
        default:
          return true
      }
    })

    const hasValidationErrors = Object.values(validationErrors).some((error) => error !== null)
    return hasRequiredFields && !hasValidationErrors
  }, [firstSurname, firstName, identificationType, identificationNumber, validationErrors])

  // Cargar datos existentes del usuario usando la API
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) return

      try {
        setLoadingData(true)
        console.log("Cargando datos existentes para usuario:", user.id)

        // Llamar a la API para obtener datos de información personal
        const response = await fetch(`/api/profile-data?userId=${user.id}&type=personal_info`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Respuesta de la API:", result)

        if (result.data) {
          const personalInfo = result.data
          console.log("Datos de información personal:", personalInfo)

          // Cargar datos existentes en el formulario
          setFirstSurname(personalInfo.first_surname || "")
          setSecondSurname(personalInfo.second_surname || "")
          setFirstName(personalInfo.first_name || "")
          setMiddleName(personalInfo.middle_name || "")
          setIdentificationType(personalInfo.identification_type || "")
          setIdentificationNumber(personalInfo.identification_number || "")
          setDocumentIssueDate(personalInfo.document_issue_date || "")
          setDocumentIssuePlace(personalInfo.document_issue_place || "")
          setGender(personalInfo.gender || "")
          setMaritalStatus(personalInfo.marital_status || "")
          setNationality(personalInfo.nationality || "")
          setCountry(personalInfo.country || "")
          setMilitaryBookletType(personalInfo.military_booklet_type || "")
          setMilitaryBookletNumber(personalInfo.military_booklet_number || "")
          setMilitaryDistrict(personalInfo.military_district || "")
          setBirthDate(personalInfo.birth_date || "")
          setBirthCountry(personalInfo.birth_country || "")
          setBirthState(personalInfo.birth_state || "")
          setBirthCity(personalInfo.birth_city || "")
          setBirthMunicipality(personalInfo.birth_municipality || "")
          setAddress(personalInfo.address || "")
          setInstitutionalAddress(personalInfo.institutional_address || "")
          setPhone(personalInfo.phone || "")
          setEmail(personalInfo.email || "")
          setInstitutionalEmail(personalInfo.institutional_email || "")
          setResidenceCountry(personalInfo.residence_country || "")
          setResidenceState(personalInfo.residence_state || "")
          setResidenceCity(personalInfo.residence_city || "")
          setResidenceMunicipality(personalInfo.residence_municipality || "")

          console.log("Datos cargados exitosamente en el formulario")
        } else {
          console.log("No se encontraron datos existentes, formulario vacío")
        }
      } catch (error) {
        console.error("Error cargando datos existentes:", error)
        setError("Error al cargar los datos existentes")
      } finally {
        setLoadingData(false)
      }
    }

    loadExistingData()
  }, [user?.id])

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

    if (!isFormValid) {
      setError("Por favor complete todos los campos obligatorios y corrija los errores de validación")
      return
    }

    setLoading(true)
    setError(null)

    try {
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

      // Verificar si ya existe información personal
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

      // Actualizar el perfil para marcar como completado
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ personal_info_completed: true })
        .eq("id", userId)

      if (profileError) throw profileError

      // Mostrar mensaje de éxito
      setError(null)
      alert("Información personal guardada correctamente")

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error al guardar la información personal")
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
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                  value={firstSurname}
                  onChange={(e) => setFirstSurname(e.target.value)}
                  validationRules={[validationRules.required, validationRules.name]}
                  sanitizer="name"
                  onValidationChange={handleValidationChange("firstSurname")}
                  required
                />

                <ValidatedInput
                  id="second-surname"
                  label="Segundo Apellido"
                  value={secondSurname}
                  onChange={(e) => setSecondSurname(e.target.value)}
                  validationRules={[validationRules.name]}
                  sanitizer="name"
                  onValidationChange={handleValidationChange("secondSurname")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValidatedInput
                  id="first-name"
                  label="Primer Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  validationRules={[validationRules.required, validationRules.name]}
                  sanitizer="name"
                  onValidationChange={handleValidationChange("firstName")}
                  required
                />

                <ValidatedInput
                  id="middle-name"
                  label="Segundo Nombre"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  validationRules={[validationRules.name]}
                  sanitizer="name"
                  onValidationChange={handleValidationChange("middleName")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                    Tipo de Documento
                  </Label>
                  <Select value={identificationType} onValueChange={setIdentificationType} required>
                    <SelectTrigger className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm">
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
                  value={identificationNumber}
                  onChange={(e) => setIdentificationNumber(e.target.value)}
                  validationRules={[validationRules.required, validationRules.identification]}
                  sanitizer="identification"
                  onValidationChange={handleValidationChange("identificationNumber")}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700">Fecha de Expedición</Label>
                  <DatePicker
                    id="document-issue-date"
                    value={documentIssueDate}
                    onChange={setDocumentIssueDate}
                    required
                    maxDate={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <ValidatedInput
                  id="document-issue-place"
                  label="Lugar de Expedición"
                  value={documentIssuePlace}
                  onChange={(e) => setDocumentIssuePlace(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("documentIssuePlace")}
                  required
                />
              </div>

              <div className="space-y-4">
                <DocumentUpload userId={userId} documentType="identification" label="Subir documento de identidad" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700">Sexo</Label>
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
                  <Label className="text-base font-semibold text-gray-700">Estado Civil</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus} required>
                    <SelectTrigger className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm">
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
                  <Label className="text-base font-semibold text-gray-700">Nacionalidad</Label>
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

              <ValidatedInput
                id="country"
                label="País"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
                  <Label className="text-base font-semibold text-gray-700">Tipo</Label>
                  <Select value={militaryBookletType} onValueChange={setMilitaryBookletType}>
                    <SelectTrigger className="border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm">
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
                    <ValidatedInput
                      id="military-booklet-number"
                      label="Número"
                      value={militaryBookletNumber}
                      onChange={(e) => setMilitaryBookletNumber(e.target.value)}
                      validationRules={[validationRules.alphanumeric]}
                      sanitizer="alphanumeric"
                      onValidationChange={handleValidationChange("militaryBookletNumber")}
                    />

                    <ValidatedInput
                      id="military-district"
                      label="Distrito Militar (D.M)"
                      value={militaryDistrict}
                      onChange={(e) => setMilitaryDistrict(e.target.value)}
                      validationRules={[validationRules.alphanumeric]}
                      sanitizer="alphanumeric"
                      onValidationChange={handleValidationChange("militaryDistrict")}
                    />
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

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">Fecha de Nacimiento</Label>
                <DatePicker
                  id="birth-date"
                  value={birthDate}
                  onChange={setBirthDate}
                  required
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ValidatedInput
                  id="birth-country"
                  label="País de Nacimiento"
                  value={birthCountry}
                  onChange={(e) => setBirthCountry(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthCountry")}
                  required
                />

                <ValidatedInput
                  id="birth-state"
                  label="Departamento de Nacimiento"
                  value={birthState}
                  onChange={(e) => setBirthState(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthState")}
                  required
                />

                <ValidatedInput
                  id="birth-city"
                  label="Municipio de Nacimiento"
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("birthCity")}
                  required
                />
              </div>

              <ValidatedInput
                id="birth-municipality"
                label="Código DANE Municipio de Nacimiento"
                value={birthMunicipality}
                onChange={(e) => setBirthMunicipality(e.target.value)}
                validationRules={[validationRules.numbers]}
                sanitizer="numbers"
                onValidationChange={handleValidationChange("birthMunicipality")}
                placeholder="Ej. 11001 para Bogotá"
              />

              <Separator className="my-4" />

              <ValidatedInput
                id="address"
                label="Dirección Personal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                validationRules={[validationRules.required, validationRules.text]}
                sanitizer="text"
                onValidationChange={handleValidationChange("address")}
                required
              />

              <ValidatedInput
                id="institutional-address"
                label="Dirección Institucional"
                value={institutionalAddress}
                onChange={(e) => setInstitutionalAddress(e.target.value)}
                validationRules={[validationRules.text]}
                sanitizer="text"
                onValidationChange={handleValidationChange("institutionalAddress")}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValidatedInput
                  id="phone"
                  label="Teléfono"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  validationRules={[validationRules.required, validationRules.phone]}
                  onValidationChange={handleValidationChange("phone")}
                  required
                />

                <ValidatedInput
                  id="email"
                  label="Correo Electrónico Personal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validationRules={[validationRules.required, validationRules.email]}
                  onValidationChange={handleValidationChange("email")}
                  required
                />
              </div>

              <ValidatedInput
                id="institutional-email"
                label="Correo Electrónico Institucional"
                type="email"
                value={institutionalEmail}
                onChange={(e) => setInstitutionalEmail(e.target.value)}
                validationRules={[validationRules.email]}
                onValidationChange={handleValidationChange("institutionalEmail")}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ValidatedInput
                  id="residence-country"
                  label="País de Residencia"
                  value={residenceCountry}
                  onChange={(e) => setResidenceCountry(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceCountry")}
                  required
                />

                <ValidatedInput
                  id="residence-state"
                  label="Departamento de Residencia"
                  value={residenceState}
                  onChange={(e) => setResidenceState(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceState")}
                  required
                />

                <ValidatedInput
                  id="residence-city"
                  label="Municipio de Residencia"
                  value={residenceCity}
                  onChange={(e) => setResidenceCity(e.target.value)}
                  validationRules={[validationRules.required, validationRules.text]}
                  sanitizer="text"
                  onValidationChange={handleValidationChange("residenceCity")}
                  required
                />
              </div>

              <ValidatedInput
                id="residence-municipality"
                label="Código DANE Municipio de Residencia"
                value={residenceMunicipality}
                onChange={(e) => setResidenceMunicipality(e.target.value)}
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
                  disabled={loading || !isFormValid}
                  className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
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
