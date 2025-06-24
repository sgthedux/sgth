"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { EvidenceUpload } from "@/components/licenses/evidence-upload"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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

export function LicenseRequestModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Campos del formulario según el nuevo formato
  const [radicado, setRadicado] = useState("")
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [areaTrabajo, setAreaTrabajo] = useState("")
  const [cargo, setCargo] = useState("")
  const [codigoTipoPermiso, setCodigoTipoPermiso] = useState("")
  const [fechaInicio, setFechaInicio] = useState<string | null>(null)
  const [fechaFinalizacion, setFechaFinalizacion] = useState<string | null>(null)
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [fechaCompensacion, setFechaCompensacion] = useState<string | null>(null)
  const [reemplazo, setReemplazo] = useState(false)
  const [reemplazante, setReemplazante] = useState("")
  const [observacion, setObservacion] = useState("")
  const [licenseRequestId, setLicenseRequestId] = useState<string | null>(null)
  const [evidences, setEvidences] = useState<any[]>([])
  
  const { toast } = useToast()
  const supabase = createClient()

  const resetForm = () => {
    setRadicado("")
    setNombres("")
    setApellidos("")
    setNumeroDocumento("")
    setAreaTrabajo("")
    setCargo("")
    setCodigoTipoPermiso("")
    setFechaInicio(null)
    setFechaFinalizacion(null)
    setHoraInicio("")
    setHoraFin("")
    setFechaCompensacion(null)
    setReemplazo(false)
    setReemplazante("")
    setObservacion("")
    setLicenseRequestId(null)
    setEvidences([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombres || !apellidos || !numeroDocumento || !cargo || !codigoTipoPermiso || !fechaInicio || !fechaFinalizacion || !observacion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (reemplazo && !reemplazante) {
      toast({
        title: "Campo requerido",
        description: "Debe especificar quién será el reemplazante",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Crear la solicitud de licencia con todos los nuevos campos
      const { data, error } = await supabase
        .from("license_requests")
        .insert({
          radicado: radicado || undefined, // Se autogenerará si está vacío
          user_id: user?.id || null,
          nombres,
          apellidos,
          numero_documento: numeroDocumento,
          area_trabajo: areaTrabajo,
          cargo,
          codigo_tipo_permiso: codigoTipoPermiso,
          fecha_inicio: fechaInicio,
          fecha_finalizacion: fechaFinalizacion,
          hora_inicio: horaInicio || null,
          hora_fin: horaFin || null,
          fecha_compensacion: fechaCompensacion,
          reemplazo,
          reemplazante: reemplazo ? reemplazante : null,
          observacion,
          estado: "pendiente",
        })
        .select()

      if (error) {
        throw new Error(error.message)
      }

      // Guardar el ID de la solicitud para las evidencias
      const newLicenseRequestId = data[0].id
      setLicenseRequestId(newLicenseRequestId)

      toast({
        title: "Solicitud enviada",
        description: "Su solicitud de licencia ha sido enviada correctamente",
      })

      // Si no hay evidencias, cerrar el modal
      if (evidences.length === 0) {
        setOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEvidenceUpload = (evidence: any) => {
    setEvidences([...evidences, evidence])

    // Si ya se creó la solicitud, cerrar el modal después de subir la evidencia
    if (licenseRequestId) {
      toast({
        title: "Evidencia subida",
        description: "La evidencia ha sido adjuntada a su solicitud",
      })
      setOpen(false)
      resetForm()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitud de Licencia o Permiso</DialogTitle>
          <DialogDescription>Complete todos los campos del formulario para solicitar una licencia o permiso.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Radicado (opcional - se autogenera) */}
            <div className="grid gap-2">
              <Label htmlFor="radicado">Radicado/Consecutivo (opcional)</Label>
              <Input
                id="radicado"
                value={radicado}
                onChange={(e) => setRadicado(e.target.value)}
                placeholder="Se generará automáticamente si se deja vacío"
              />
            </div>

            {/* Información personal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="numero-documento">Número de Documento *</Label>
                <Input
                  id="numero-documento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area-trabajo">Área de Trabajo</Label>
                <Input
                  id="area-trabajo"
                  value={areaTrabajo}
                  onChange={(e) => setAreaTrabajo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
              />
            </div>

            {/* Tipo de permiso */}
            <div className="grid gap-2">
              <Label htmlFor="tipo-permiso">Tipo de Permiso *</Label>
              <Select value={codigoTipoPermiso} onValueChange={setCodigoTipoPermiso} required>
                <SelectTrigger id="tipo-permiso">
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
            </div>

            {/* Fechas y horas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha de Inicio *</Label>
                <DatePicker
                  id="fecha-inicio"
                  label=""
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha de Finalización *</Label>
                <DatePicker
                  id="fecha-finalizacion"
                  label=""
                  value={fechaFinalizacion}
                  onChange={setFechaFinalizacion}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hora-inicio">Hora de Inicio</Label>
                <Input
                  id="hora-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hora-fin">Hora de Fin</Label>
                <Input
                  id="hora-fin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Fecha de Compensación</Label>
              <DatePicker
                id="fecha-compensacion"
                label=""
                value={fechaCompensacion}
                onChange={setFechaCompensacion}
              />
            </div>

            {/* Reemplazo */}
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reemplazo"
                  checked={reemplazo}
                  onCheckedChange={(checked) => setReemplazo(checked === true)}
                />
                <Label htmlFor="reemplazo">¿Requiere reemplazo?</Label>
              </div>
              
              {reemplazo && (
                <div className="grid gap-2">
                  <Label htmlFor="reemplazante">Nombre del Reemplazante *</Label>
                  <Input
                    id="reemplazante"
                    value={reemplazante}
                    onChange={(e) => setReemplazante(e.target.value)}
                    required={reemplazo}
                    placeholder="Ingrese el nombre completo del reemplazante"
                  />
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="grid gap-2">
              <Label htmlFor="observacion">Motivo/Observación *</Label>
              <Textarea
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Describa detalladamente el motivo de su solicitud"
                required
                rows={4}
              />
            </div>

            {/* Evidencias */}
            {licenseRequestId ? (
              <div className="grid gap-2">
                <Label>Evidencia</Label>
                <EvidenceUpload onUploadComplete={handleEvidenceUpload} licenseRequestId={licenseRequestId} />
              </div>
            ) : null}

            {evidences.length > 0 && (
              <div className="grid gap-2">
                <Label>Evidencias adjuntas</Label>
                <div className="space-y-2">
                  {evidences.map((evidence, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate">{evidence.file_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!licenseRequestId ? (
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
              >
                Finalizar
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
