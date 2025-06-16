"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  FileText, 
  Filter, 
  Plus, 
  Search,
  XCircle 
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { LicenseRequestForm } from "@/components/licenses/license-request-form"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"

interface LicenseRequest {
  id: string
  radicado: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string
  fecha_finalizacion: string
  observacion?: string
  estado: "pendiente" | "en_revision" | "aprobada" | "rechazada"
  comentarios_rh?: string
  created_at: string
  updated_at: string
  evidences?: Array<{
    id: string
    file_name: string
    file_url: string
  }>
}

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    variant: "outline" as const,
    icon: Clock,
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  en_revision: {
    label: "En Revisión", 
    variant: "outline" as const,
    icon: AlertTriangle,
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  aprobada: {
    label: "Aprobada",
    variant: "outline" as const,
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
  },
  rechazada: {
    label: "Rechazada",
    variant: "outline" as const,
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
}

export default function LicensesPage() {
  const { toast } = useToast()
  const [licenses, setLicenses] = useState<LicenseRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const supabase = createClient()

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch = 
      license.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.numero_documento.includes(searchTerm)
    
    const matchesStatus = statusFilter === "all" || license.estado === statusFilter
    
    return matchesSearch && matchesStatus
  })

  async function fetchLicenses() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("license_requests")
        .select(`
          *,
          evidences:license_evidences(*)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching licenses:", error)
        toast({
          title: "Error",
          description: "Error al cargar las licencias",
          variant: "destructive",
        })
        return
      }

      setLicenses(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Error inesperado al cargar las licencias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateLicenseStatus(licenseId: string, newStatus: string, comments?: string) {
    try {
      const { error } = await supabase
        .from("license_requests")
        .update({ 
          estado: newStatus,
          comentarios_rh: comments,
          updated_at: new Date().toISOString()
        })
        .eq("id", licenseId)

      if (error) {
        console.error("Error updating license status:", error)
        toast({
          title: "Error",
          description: "Error al actualizar el estado de la licencia",
          variant: "destructive",
        })
        return
      }

      const statusLabels: { [key: string]: string } = {
        aprobada: "aprobada",
        rechazada: "rechazada",
        en_revision: "puesta en revisión",
        pendiente: "marcada como pendiente",
      }

      toast({
        title: "Estado actualizado",
        description: `La licencia ha sido ${statusLabels[newStatus] || "actualizada"} exitosamente`,
      })

      fetchLicenses()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el estado",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchLicenses()
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Licencias</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra las solicitudes de licencias del personal
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Licencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Solicitud de Licencia</DialogTitle>
            </DialogHeader>
            <LicenseRequestForm
              onSuccess={() => {
                setIsCreateModalOpen(false)
                fetchLicenses()
              }}
              onClose={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
          <CardDescription>
            Busca y filtra las solicitudes de licencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por radicado, nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="en_revision">En Revisión</SelectItem>
                  <SelectItem value="aprobada">Aprobadas</SelectItem>
                  <SelectItem value="rechazada">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Solicitudes de Licencias ({filteredLicenses.length})
          </CardTitle>
          <CardDescription>
            Gestiona el estado de las solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No se encontraron licencias</p>
              <p className="text-muted-foreground text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Crea la primera solicitud de licencia"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vista mobile - Cards */}
              <div className="block lg:hidden space-y-4">
                {filteredLicenses.map((license) => {
                  const statusConfig = estadoConfig[license.estado]
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <Card key={license.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm">
                                {license.nombres} {license.apellidos}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {license.numero_documento} • {license.cargo}
                              </p>
                            </div>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Radicado:</span>
                              <p className="text-muted-foreground">{license.radicado}</p>
                            </div>
                            <div>
                              <span className="font-medium">Evidencias:</span>
                              <p className="text-muted-foreground">
                                {license.evidences?.length || 0} archivos
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Inicio:</span>
                              <p className="text-muted-foreground">
                                {formatDate(new Date(license.fecha_inicio))}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Fin:</span>
                              <p className="text-muted-foreground">
                                {formatDate(new Date(license.fecha_finalizacion))}
                              </p>
                            </div>
                          </div>

                          {license.estado === "pendiente" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => updateLicenseStatus(license.id, "aprobada")}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateLicenseStatus(license.id, "rechazada")}
                                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Funcionalidad pendiente",
                                  description: "La vista de detalles estará disponible pronto",
                                })
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver detalles
                            </Button>
                            
                            <Select onValueChange={(value) => updateLicenseStatus(license.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Cambiar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="en_revision">En Revisión</SelectItem>
                                <SelectItem value="aprobada">Aprobada</SelectItem>
                                <SelectItem value="rechazada">Rechazada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Vista desktop - Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Radicado</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="w-32">Documento</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="w-48">Fechas</TableHead>
                      <TableHead className="w-32">Estado</TableHead>
                      <TableHead className="w-24">Creado</TableHead>
                      <TableHead className="w-24">Evidencias</TableHead>
                      <TableHead className="w-48">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map((license) => {
                      const statusConfig = estadoConfig[license.estado]
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <TableRow key={license.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {license.radicado}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {license.nombres} {license.apellidos}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {license.numero_documento}
                          </TableCell>
                          <TableCell>{license.cargo}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Del: {formatDate(new Date(license.fecha_inicio))}</div>
                              <div>Al: {formatDate(new Date(license.fecha_finalizacion))}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(new Date(license.created_at))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">
                                {license.evidences?.length || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Funcionalidad pendiente",
                                    description: "La vista de detalles estará disponible pronto",
                                  })
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {license.estado === "pendiente" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateLicenseStatus(license.id, "aprobada")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateLicenseStatus(license.id, "rechazada")}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              <Select onValueChange={(value) => updateLicenseStatus(license.id, value)}>
                                <SelectTrigger className="w-8 h-8 p-0">
                                  <SelectValue>
                                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="en_revision">En Revisión</SelectItem>
                                  <SelectItem value="aprobada">Aprobada</SelectItem>
                                  <SelectItem value="rechazada">Rechazada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
