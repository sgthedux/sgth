"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CalendarDays, FileText, Copy, CheckCircle, AlertTriangle, Upload, Loader2 } from "lucide-react"
import { FileUpload } from "./file-upload"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface LicenseRequestFormProps {
  onSubmit?: (data: LicenseRequestData) => void
  isLoading?: boolean
  onSuccess?: (result: any) => void
  onClose?: () => void
}

interface LicenseRequestData {
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  area_trabajo?: string
  cargo: string
  codigo_tipo_permiso: string
  fecha_inicio: string
  fecha_finalizacion: string
  hora_inicio?: string
  hora_fin?: string
  fecha_compensacion?: string
  reemplazo: boolean
  reemplazante?: string
  observacion: string
  documentos_soporte: File[]
}

const tiposDocumento = [
  { value: "cedula", label: "Cédula de Ciudadanía" },
  { value: "cedula_extranjeria", label: "Cédula de Extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "tarjeta_identidad", label: "Tarjeta de Identidad" },
]

// Tipos de permiso según códigos
const TIPOS_PERMISO = [
  { code: "PR", name: "Permiso Remunerado" },
  { code: "PNR", name: "Permiso No Remunerado" },
  { code: "LM", name: "Licencia de Maternidad" },
  { code: "LP", name: "Licencia de Paternidad" },
  { code: "IRL", name: "Incapacidad por Riesgo Laboral" },
  { code: "IGE", name: "Incapacidad General" },
  { code: "COM", name: "Compensatorio" },
  { code: "VAC", name: "Vacaciones" },
  { code: "PER", name: "Personal" },
  { code: "EST", name: "Estudio" },
  { code: "LUT", name: "Luto" },
  { code: "OTR", name: "Otro" },
]

export function LicenseRequestForm({
  onSubmit,
  isLoading: externalLoading = false,
  onSuccess,
  onClose,
}: LicenseRequestFormProps) {
  const [formData, setFormData] = useState<LicenseRequestData>({
    nombres: "",
    apellidos: "",
    tipo_documento: "",
    numero_documento: "",
    area_trabajo: "",
    cargo: "",
    codigo_tipo_permiso: "",
    fecha_inicio: "",
    fecha_finalizacion: "",
    hora_inicio: "",
    hora_fin: "",
    fecha_compensacion: "",
    reemplazo: false,
    reemplazante: "",
    observacion: "",
    documentos_soporte: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(externalLoading)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [radicado, setRadicado] = useState("")
  const [copied, setCopied] = useState(false)
  const [isSimulated, setIsSimulated] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.nombres.trim()) newErrors.nombres = "Los nombres son requeridos"
    if (!formData.apellidos.trim()) newErrors.apellidos = "Los apellidos son requeridos"
    if (!formData.tipo_documento) newErrors.tipo_documento = "Debe seleccionar un tipo de documento"
    if (!formData.numero_documento.trim()) newErrors.numero_documento = "El número de documento es requerido"
    if (!formData.cargo.trim()) newErrors.cargo = "El cargo es requerido"
    if (!formData.codigo_tipo_permiso) newErrors.codigo_tipo_permiso = "Debe seleccionar un tipo de permiso"
    if (!formData.fecha_inicio) newErrors.fecha_inicio = "La fecha de inicio es requerida"
    if (!formData.fecha_finalizacion) newErrors.fecha_finalizacion = "La fecha de finalización es requerida"
    if (formData.fecha_inicio && formData.fecha_finalizacion) {
      const inicio = new Date(formData.fecha_inicio)
      const fin = new Date(formData.fecha_finalizacion)
      
      // Permitir fechas iguales si se especifican horas (permisos por horas)
      const tieneHoras = formData.hora_inicio && formData.hora_fin
      
      if (tieneHoras) {
        // Si hay horas, validar que la fecha fin sea igual o posterior
        if (fin < inicio) {
          newErrors.fecha_finalizacion = "La fecha de finalización no puede ser anterior a la fecha de inicio"
        }
        // Si es el mismo día, validar que la hora fin sea posterior a la hora inicio
        if (fin.getTime() === inicio.getTime() && formData.hora_inicio && formData.hora_fin) {
          const horaInicio = formData.hora_inicio
          const horaFin = formData.hora_fin
          if (horaFin <= horaInicio) {
            newErrors.hora_fin = "La hora de fin debe ser posterior a la hora de inicio"
          }
        }
      } else {
        // Si no hay horas especificadas, la fecha fin debe ser posterior (no igual)
        if (fin <= inicio) {
          newErrors.fecha_finalizacion = "La fecha de finalización debe ser posterior a la fecha de inicio"
        }
      }
    }
    if (formData.reemplazo && !formData.reemplazante?.trim()) {
      newErrors.reemplazante = "Debe especificar quién será el reemplazante"
    }
    if (!formData.observacion.trim()) newErrors.observacion = "La observación es requerida"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setDebugInfo("") // Clear previous debug info

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "documentos_soporte") {
          formDataToSend.append(key, value as string)
        }
      })
      formData.documentos_soporte.forEach((file) => {
        formDataToSend.append("evidences", file)
      })

      console.log(
        "📤 [FORM] Enviando solicitud a /api/licenses/create con",
        formData.documentos_soporte.length,
        "archivos",
      )

      const response = await fetch("/api/licenses/create", {
        // Reverted to main API endpoint
        method: "POST",
        body: formDataToSend,
      })

      const responseText = await response.text()
      console.log("📄 [FORM] Contenido de respuesta (primeros 500 chars):", responseText.substring(0, 500))
      setDebugInfo(
        `Status: ${response.status}, Content-Type: ${response.headers.get("content-type")}, Response: ${responseText.substring(0, 200)}...`,
      )

      let result
      try {
        result = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("❌ [FORM] Error al parsear la respuesta JSON:", jsonError, "Respuesta:", responseText)
        throw new Error(`Respuesta inválida del servidor (no es JSON): ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok || !result.success) {
        const errorMessage = result.error || `Error del servidor: ${response.status}`
        console.error("❌ [FORM] Error en la respuesta:", result)
        throw new Error(errorMessage)
      }

      console.log("✅ [FORM] Respuesta parseada exitosamente:", result)

      // Siempre mostrar la pantalla de éxito del formulario primero
      setRadicado(result.radicado || "No disponible")
      setSubmitSuccess(true)
      setIsSimulated(result.simulated || false)
      setUploadSummary(result.summary || null)
      
      // Ejecutar callback del padre si existe
      if (onSuccess) {
        onSuccess(result)
      }

      toast({
        title: "¡Formulario Enviado Correctamente!",
        description: `Este es tu radicado: ${result.radicado}. Cópialo y guárdalo como evidencia de tu solicitud.`,
        duration: 5000,
      })

      // NO limpiar el formulario automáticamente, solo mostrar el éxito
      // El usuario decidirá si crear nueva solicitud o consultar estado
    } catch (error) {
      console.error("💥 [FORM] Error completo:", error)
      toast({
        title: "Error al enviar la solicitud",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LicenseRequestData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleFilesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, documentos_soporte: files }))
  }

  const copyRadicado = () => {
    if (!radicado) return
    navigator.clipboard.writeText(radicado)
    setCopied(true)
    toast({ 
      title: "¡Radicado copiado!", 
      description: "El número de radicado ha sido copiado al portapapeles",
      duration: 3000,
    })
    setTimeout(() => setCopied(false), 3000)
  }

  const resetForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      tipo_documento: "",
      numero_documento: "",
      area_trabajo: "",
      cargo: "",
      codigo_tipo_permiso: "",
      fecha_inicio: "",
      fecha_finalizacion: "",
      hora_inicio: "",
      hora_fin: "",
      fecha_compensacion: "",
      reemplazo: false,
      reemplazante: "",
      observacion: "",
      documentos_soporte: [],
    })
    setSubmitSuccess(false)
    setRadicado("")
    setCopied(false)
    setUploadSummary(null)
    setErrors({})
  }

  // Si el componente padre (Dialog en consulta-licencias) maneja el estado de submitSuccess,
  // esta lógica de renderizado de éxito/formulario podría no ser necesaria aquí.
  // Se asume que `onSuccess` es provisto y el padre maneja el cierre del modal y la UI de éxito.
  // Si este formulario se usa standalone, la lógica de abajo es necesaria.

  if (submitSuccess) {
    // Mostrar pantalla de éxito SIEMPRE cuando submitSuccess es true
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl text-green-800 mb-2">¡Formulario Enviado Correctamente!</CardTitle>
          <CardDescription className="text-lg sm:text-xl text-gray-600">
            Este es tu radicado, cópialo y guárdalo como evidencia de tu solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <Alert className="bg-amber-50 border-amber-300 border-2">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            <AlertTitle className="text-amber-800 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
              🎯 ESTE ES TU RADICADO - CÓPIALO Y GUÁRDALO
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
                Este número es tu COMPROBANTE ÚNICO de la solicitud. 
                <span className="text-red-600"> ¡Es IRRECUPERABLE si lo pierdes!</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 p-4 sm:p-6 bg-white border-2 sm:border-3 border-amber-400 rounded-xl shadow-lg">
                <div className="flex-1 w-full text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">📋 NÚMERO DE RADICADO:</p>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-wider bg-yellow-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border-2 border-yellow-300 block sm:inline-block break-all">
                    {radicado}
                  </span>
                </div>
                <Button 
                  variant={copied ? "default" : "outline"} 
                  size="lg" 
                  className={copied ? 
                    "bg-green-600 hover:bg-green-700 text-white text-sm sm:text-lg px-4 py-3 sm:px-6 sm:py-4 w-full sm:w-auto" : 
                    "border-amber-400 hover:bg-amber-50 text-sm sm:text-lg px-4 py-3 sm:px-6 sm:py-4 w-full sm:w-auto"
                  }
                  onClick={copyRadicado}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                      ¡COPIADO!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                      COPIAR RADICADO
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-100 rounded-lg border border-amber-300">
                <p className="text-amber-800 font-semibold text-base sm:text-lg">
                  💡 <strong>¡IMPORTANTE!</strong> Usa este radicado para:
                </p>
                <ul className="mt-2 text-amber-700 text-sm sm:text-base space-y-1">
                  <li>✓ Consultar el estado de tu solicitud</li>
                  <li>✓ Comunicarte con Recursos Humanos</li>
                  <li>✓ Como evidencia de que enviaste la solicitud</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {uploadSummary && (
            <Alert className="bg-blue-50 border-blue-200">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 text-sm sm:text-base">📎 Resumen de archivos adjuntos</AlertTitle>
              <AlertDescription className="text-blue-700">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold">{uploadSummary.totalFiles}</div>
                    <div className="text-xs">Archivos totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-green-600">{uploadSummary.uploadedFiles}</div>
                    <div className="text-xs">Subidos exitosamente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-red-600">{uploadSummary.failedFiles}</div>
                    <div className="text-xs">Fallos</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 text-sm sm:text-base">¿Qué sigue ahora?</AlertTitle>
            <AlertDescription className="text-blue-700">
              <ol className="list-decimal list-inside space-y-1 mt-2 text-sm sm:text-base">
                <li>Su solicitud será revisada por el equipo de Recursos Humanos</li>
                <li>Recibirá una notificación sobre el estado de su solicitud</li>
                <li>Puede consultar el estado usando el radicado en cualquier momento</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={resetForm} 
              variant="outline"
              className="order-2 sm:order-1 w-full sm:w-auto"
            >
              Crear nueva solicitud
            </Button>
            {onClose ? (
              <Button 
                onClick={onClose}
                className="order-1 sm:order-2 w-full sm:w-auto"
              >
                Cerrar
              </Button>
            ) : (
              <Button 
                onClick={() => window.location.href = '/consulta-licencias'}
                className="order-1 sm:order-2 w-full sm:w-auto"
              >
                Consultar estado de solicitudes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Solicitud de Licencia o Permiso
        </CardTitle>
        <CardDescription>Complete todos los campos para enviar su solicitud</CardDescription>
      </CardHeader>
      <CardContent>
        {debugInfo && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Información de Debug (Error Reciente)</AlertTitle>
            <AlertDescription className="text-xs font-mono break-all">{debugInfo}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* El radicado se genera automáticamente en el servidor */}

          {/* Nota informativa sobre datos personales */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold">Importante - Datos Personales</AlertTitle>
            <AlertDescription className="text-amber-700 text-sm">
              <strong>Los datos personales deben coincidir exactamente con los registrados en su documento de identificación.</strong> Verifique la ortografía de nombres y apellidos antes de enviar la solicitud.
            </AlertDescription>
          </Alert>

          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                placeholder="Ingrese sus nombres"
                value={formData.nombres}
                onChange={(e) => handleInputChange("nombres", e.target.value)}
                className={errors.nombres ? "border-red-500" : ""}
              />
              {errors.nombres && <p className="text-sm text-red-500">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                placeholder="Ingrese sus apellidos"
                value={formData.apellidos}
                onChange={(e) => handleInputChange("apellidos", e.target.value)}
                className={errors.apellidos ? "border-red-500" : ""}
              />
              {errors.apellidos && <p className="text-sm text-red-500">{errors.apellidos}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
              <Select
                value={formData.tipo_documento}
                onValueChange={(value) => handleInputChange("tipo_documento", value)}
              >
                <SelectTrigger className={errors.tipo_documento ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccione el tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_documento && <p className="text-sm text-red-500">{errors.tipo_documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Número de Documento *</Label>
              <Input
                id="numero_documento"
                placeholder="Ingrese el número de documento"
                value={formData.numero_documento}
                onChange={(e) => handleInputChange("numero_documento", e.target.value)}
                className={errors.numero_documento ? "border-red-500" : ""}
              />
              {errors.numero_documento && <p className="text-sm text-red-500">{errors.numero_documento}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_trabajo">Área de Trabajo</Label>
              <Input
                id="area_trabajo"
                placeholder="Ingrese su área de trabajo"
                value={formData.area_trabajo}
                onChange={(e) => handleInputChange("area_trabajo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                placeholder="Ingrese su cargo actual"
                value={formData.cargo}
                onChange={(e) => handleInputChange("cargo", e.target.value)}
                className={errors.cargo ? "border-red-500" : ""}
              />
              {errors.cargo && <p className="text-sm text-red-500">{errors.cargo}</p>}
            </div>
          </div>

          {/* Tipo de permiso */}
          <div className="space-y-2">
            <Label htmlFor="codigo_tipo_permiso">Tipo de Permiso *</Label>
            <Select
              value={formData.codigo_tipo_permiso}
              onValueChange={(value) => handleInputChange("codigo_tipo_permiso", value)}
            >
              <SelectTrigger className={errors.codigo_tipo_permiso ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleccione el tipo de permiso" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PERMISO.map((tipo) => (
                  <SelectItem key={tipo.code} value={tipo.code}>
                    {tipo.code} - {tipo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.codigo_tipo_permiso && <p className="text-sm text-red-500">{errors.codigo_tipo_permiso}</p>}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de Inicio *
              </Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => {
                  const value = e.target.value
                  if (value) {
                    // Crear fecha directamente desde YYYY-MM-DD sin conversión de zona horaria
                    const [year, month, day] = value.split('-').map(Number)
                    const date = new Date(year, month - 1, day, 12, 0, 0)
                    handleInputChange("fecha_inicio", date.toISOString().split('T')[0])
                  } else {
                    handleInputChange("fecha_inicio", value)
                  }
                }}
                className={errors.fecha_inicio ? "border-red-500" : ""}
              />
              {errors.fecha_inicio && <p className="text-sm text-red-500">{errors.fecha_inicio}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_finalizacion" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Fecha de Finalización *
              </Label>
              <Input
                id="fecha_finalizacion"
                type="date"
                value={formData.fecha_finalizacion}
                onChange={(e) => {
                  const value = e.target.value
                  if (value) {
                    // Crear fecha directamente desde YYYY-MM-DD sin conversión de zona horaria
                    const [year, month, day] = value.split('-').map(Number)
                    const date = new Date(year, month - 1, day, 12, 0, 0)
                    handleInputChange("fecha_finalizacion", date.toISOString().split('T')[0])
                  } else {
                    handleInputChange("fecha_finalizacion", value)
                  }
                }}
                className={errors.fecha_finalizacion ? "border-red-500" : ""}
              />
              {errors.fecha_finalizacion && <p className="text-sm text-red-500">{errors.fecha_finalizacion}</p>}
            </div>
          </div>

          {/* Nota informativa sobre fechas */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-sm">
              <strong>Nota:</strong> Para permisos por horas (mismo día), puede usar la misma fecha de inicio y fin, pero debe especificar las horas correspondientes.
            </AlertDescription>
          </Alert>

          {/* Horas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora de Inicio</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => handleInputChange("hora_inicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin">Hora de Fin</Label>
              <Input
                id="hora_fin"
                type="time"
                value={formData.hora_fin}
                onChange={(e) => handleInputChange("hora_fin", e.target.value)}
                className={errors.hora_fin ? "border-red-500" : ""}
              />
              {errors.hora_fin && <p className="text-sm text-red-500">{errors.hora_fin}</p>}
            </div>
          </div>

          {/* Fecha de compensación */}
          <div className="space-y-2">
            <Label htmlFor="fecha_compensacion">Fecha de Compensación</Label>
            <Input
              id="fecha_compensacion"
              type="date"
              value={formData.fecha_compensacion}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  // Crear fecha directamente desde YYYY-MM-DD sin conversión de zona horaria
                  const [year, month, day] = value.split('-').map(Number)
                  const date = new Date(year, month - 1, day, 12, 0, 0)
                  handleInputChange("fecha_compensacion", date.toISOString().split('T')[0])
                } else {
                  handleInputChange("fecha_compensacion", value)
                }
              }}
            />
          </div>

          {/* Reemplazo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reemplazo"
                checked={formData.reemplazo}
                onCheckedChange={(checked) => handleInputChange("reemplazo", checked === true)}
              />
              <Label htmlFor="reemplazo">¿Requiere reemplazo?</Label>
            </div>
            
            {formData.reemplazo && (
              <div className="space-y-2">
                <Label htmlFor="reemplazante">Nombre del Reemplazante *</Label>
                <Input
                  id="reemplazante"
                  placeholder="Ingrese el nombre completo del reemplazante"
                  value={formData.reemplazante}
                  onChange={(e) => handleInputChange("reemplazante", e.target.value)}
                  className={errors.reemplazante ? "border-red-500" : ""}
                />
                {errors.reemplazante && <p className="text-sm text-red-500">{errors.reemplazante}</p>}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observacion">Motivo/Observación *</Label>
            <Textarea
              id="observacion"
              placeholder="Describa detalladamente el motivo de su solicitud"
              value={formData.observacion}
              onChange={(e) => handleInputChange("observacion", e.target.value)}
              className={errors.observacion ? "border-red-500" : ""}
              rows={4}
            />
            {errors.observacion && <p className="text-sm text-red-500">{errors.observacion}</p>}
          </div>

          {/* Evidencias */}
          <div className="space-y-2">
            <Label>Cargar Evidencias</Label>
            <FileUpload
              onFilesAccepted={handleFilesChange}
              maxFiles={5}
              acceptedTypes={[".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]}
            />
            <p className="text-sm text-gray-500">Adjunte los documentos de soporte (máx. 5 archivos, 5MB c/u)</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
