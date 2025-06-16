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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { EvidenceUpload } from "@/components/licenses/evidence-upload"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Plus } from "lucide-react"

export function LicenseRequestModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licenseType, setLicenseType] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [reason, setReason] = useState("")
  const [licenseRequestId, setLicenseRequestId] = useState<string | null>(null)
  const [evidences, setEvidences] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  const resetForm = () => {
    setLicenseType("")
    setStartDate(undefined)
    setEndDate(undefined)
    setReason("")
    setLicenseRequestId(null)
    setEvidences([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!licenseType || !startDate || !endDate || !reason) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos requeridos",
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

      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo verificar su identidad",
          variant: "destructive",
        })
        return
      }

      // Crear la solicitud de licencia
      const { data, error } = await supabase
        .from("license_requests")
        .insert({
          user_id: user.id,
          license_type: licenseType,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reason,
          status: "pending",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitud de Licencia</DialogTitle>
          <DialogDescription>Complete el formulario para solicitar una licencia o permiso.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="license-type">Tipo de Licencia</Label>
              <Select value={licenseType} onValueChange={setLicenseType} required>
                <SelectTrigger id="license-type">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Licencia Médica</SelectItem>
                  <SelectItem value="personal">Permiso Personal</SelectItem>
                  <SelectItem value="bereavement">Licencia por Luto</SelectItem>
                  <SelectItem value="maternity">Licencia de Maternidad</SelectItem>
                  <SelectItem value="paternity">Licencia de Paternidad</SelectItem>
                  <SelectItem value="study">Permiso de Estudio</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Fecha de Inicio</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">Fecha de Fin</Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa el motivo de su solicitud"
                required
              />
            </div>

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
                {loading ? "Enviando..." : "Enviar solicitud"}
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
