"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, CheckCircle, Users, FileText, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge" 
import { useDashboardStats, useRecentActivity } from "@/hooks/use-dashboard-data"
import { generateLicenseReport } from "@/lib/report-generator"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export default function RHDashboardPage() {
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useRecentActivity()
  const { toast } = useToast()
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const statsConfig = [
    { 
      title: "Solicitudes Pendientes", 
      value: stats?.pendingRequests?.toString() || "0", 
      icon: FileText, 
      color: "text-yellow-500" 
    },
    { 
      title: "Licencias Aprobadas (Mes)", 
      value: stats?.approvedThisMonth?.toString() || "0", 
      icon: CheckCircle, 
      color: "text-green-500" 
    },
    { 
      title: "Total Empleados Activos", 
      value: stats?.totalActiveEmployees?.toString() || "0", 
      icon: Users, 
      color: "text-blue-500" 
    },
    { 
      title: "Reportes Generados", 
      value: stats?.reportsGenerated?.toString() || "0", 
      icon: BarChart, 
      color: "text-purple-500" 
    },
  ]

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Hace menos de 1 hora"
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    
    return date.toLocaleDateString()
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente'
      case 'aprobado': return 'Aprobada'
      case 'rechazado': return 'Rechazada'
      default: return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'aprobado': return 'default'
      case 'rechazado': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'aprobado': return 'bg-green-500 text-white'
      case 'pendiente': return 'border-yellow-500 text-yellow-600'
      default: return ''
    }
  }

  const handleDownloadReport = async () => {
    if (!stats || stats.pendingRequests === 0 && stats.approvedThisMonth === 0) {
      toast({
        title: "Sin datos para reporte",
        description: "No hay suficientes datos de licencias para generar un reporte.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingReport(true)
    try {
      toast({
        title: "Generando reporte...",
        description: "Por favor espera mientras se genera el archivo Excel con todos los datos de licencias.",
      })

      // Usar la nueva API para generar el reporte desde el servidor
      const response = await fetch('/api/licenses/report', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al generar el reporte desde el servidor')
      }

      // Crear blob del archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Crear elemento para descarga
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte_General_Licencias_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      
      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "¡Reporte generado exitosamente!",
        description: "El archivo Excel se ha descargado automáticamente. Revisa tu carpeta de descargas.",
      })
    } catch (error: any) {
      console.error('Error generando reporte:', error)
      
      // Fallback: intentar con el método original del cliente
      try {
        console.log('🔄 Intentando generar reporte desde el cliente como fallback...')
        await generateLicenseReport()
        
        toast({
          title: "¡Reporte generado exitosamente!",
          description: "El archivo Excel se ha descargado automáticamente. Revisa tu carpeta de descargas.",
        })
      } catch (fallbackError: any) {
        console.error('Error en fallback:', fallbackError)
        toast({
          title: "Error al generar reporte",
          description: fallbackError.message || "Ocurrió un error al generar el reporte Excel. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Talento Humano</h1>
          <p className="text-muted-foreground">Bienvenido, aquí tienes un resumen de la actividad reciente.</p>
        </div>
        <Button onClick={handleDownloadReport} disabled={isGeneratingReport}>
          {isGeneratingReport ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isGeneratingReport ? "Generando..." : "Descargar Reporte General"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </CardTitle>
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))
        ) : statsError ? (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardContent className="pt-6">
              <p className="text-red-500 text-center">Error al cargar las estadísticas</p>
            </CardContent>
          </Card>
        ) : (
          statsConfig.map((statConfig) => (
            <Card key={statConfig.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{statConfig.title}</CardTitle>
                <statConfig.icon className={`h-5 w-5 ${statConfig.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statConfig.value}</div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? "Cargando..." : "Datos actualizados hoy"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente de Licencias</CardTitle>
            <CardDescription>Últimas 5 solicitudes recibidas.</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <p className="text-red-500 text-center py-4">Error al cargar la actividad reciente</p>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((item) => (
                  <Link
                    href={`/rh/licenses?search=${item.radicado}`}
                    key={item.id}
                    className="block hover:bg-muted/50 p-3 rounded-lg border transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.nombres} {item.apellidos}</p>
                        <p className="text-xs text-muted-foreground">{item.tipo_licencia}</p>
                        <p className="text-xs text-gray-500 mt-1">#{item.radicado}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={getStatusVariant(item.estado)}
                          className={getStatusClasses(item.estado)}
                        >
                          {getStatusLabel(item.estado)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No hay actividad reciente</p>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Para aprobar, rechazar o ver detalles completos, dirígete a la sección de{" "}
              <Link href="/rh/licenses" className="text-primary hover:underline">
                Gestión de Licencias
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a tareas comunes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/rh/licenses">Gestionar Licencias</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
