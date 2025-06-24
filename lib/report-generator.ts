import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

interface ReportData {
  id: string
  radicado: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string
  fecha_finalizacion: string
  observacion: string
  estado: string
  created_at: string
  updated_at: string
  reviewed_at?: string
}

export async function generateLicenseReport() {
  const supabase = createClient()
  
  try {
    console.log('🔄 Generando reporte de licencias...')
      // Obtener todos los datos de licencias con evidencias
    const { data, error } = await supabase
      .from('license_requests')
      .select(`
        *,
        evidences:license_evidences(
          id,
          file_name,
          file_type,
          file_size,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error al obtener datos:', error)
      throw new Error(`Error al obtener datos: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No hay datos de licencias para generar el reporte')
    }

    console.log(`📊 Procesando ${data.length} registros de licencias`)    // Formatear datos para el Excel con todos los campos del formulario actualizado
    const formattedData = data.map((item: any) => ({
      'Radicado': item.radicado || 'N/A',
      'Nombres': item.nombres || 'N/A',
      'Apellidos': item.apellidos || 'N/A',
      'Tipo Documento': formatDocumentType(item.tipo_documento),
      'Número Documento': item.numero_documento || 'N/A',
      'Cargo': item.cargo || 'N/A',
      'Área de Trabajo': item.area_trabajo || 'N/A',
      'Código Tipo Permiso': item.codigo_tipo_permiso || 'N/A',
      'Tipo de Permiso': formatPermisoType(item.codigo_tipo_permiso),
      'Fecha Inicio': formatDate(item.fecha_inicio),
      'Fecha Finalización': formatDate(item.fecha_finalizacion),
      'Hora Inicio': item.hora_inicio || 'N/A',
      'Hora Fin': item.hora_fin || 'N/A',
      'Fecha Compensación': item.fecha_compensacion ? formatDate(item.fecha_compensacion) : 'N/A',
      'Requiere Reemplazo': item.reemplazo ? 'SÍ' : 'NO',
      'Nombre Reemplazante': item.reemplazante || 'N/A',
      'Días/Horas de Permiso': calculatePermisoDuration(item.fecha_inicio, item.fecha_finalizacion, item.hora_inicio, item.hora_fin),
      'Estado': formatStatus(item.estado),
      'Motivo/Observación': item.observacion || 'N/A',
      'Comentarios RH': item.comentarios_rh || 'N/A',
      'Cantidad Evidencias': item.evidences?.length || 0,
      'Archivos Adjuntos': item.evidences?.map((e: any) => e.file_name).join(', ') || 'Sin archivos',
      'Fecha Solicitud': formatDateTime(item.created_at),
      'Fecha Actualización': formatDateTime(item.updated_at),
      'Fecha Actualización RH': item.fecha_actualizacion ? formatDateTime(item.fecha_actualizacion) : 'N/A'
    }))

    // Estadísticas adicionales
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const thisMonthData = data.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
    })

    const stats = {
      'Total Solicitudes': data.length,
      'Pendientes': data.filter(item => item.estado === 'pendiente').length,
      'En Revisión': data.filter(item => item.estado === 'en_revision').length,
      'Aprobadas': data.filter(item => item.estado === 'aprobada').length,
      'Rechazadas': data.filter(item => item.estado === 'rechazada').length,
      'Solicitudes Este Mes': thisMonthData.length,
      'Aprobadas Este Mes': thisMonthData.filter(item => item.estado === 'aprobada').length,
      'Fecha Generación': new Date().toLocaleString('es-CO'),
      'Generado Por': 'Sistema SGTH - Recursos Humanos'
    }

    // Crear libro de trabajo Excel
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Resumen/Estadísticas
    const statsData = Object.entries(stats).map(([key, value]) => ({
      'Concepto': key,
      'Valor': value
    }))
    const statsSheet = XLSX.utils.json_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Resumen')

    // Hoja 2: Datos completos
    const dataSheet = XLSX.utils.json_to_sheet(formattedData)    // Configurar ancho de columnas actualizado para todos los campos
    const colWidths = [
      { wch: 18 }, // Radicado
      { wch: 15 }, // Nombres
      { wch: 15 }, // Apellidos
      { wch: 18 }, // Tipo Documento
      { wch: 15 }, // Número Documento
      { wch: 25 }, // Cargo
      { wch: 20 }, // Área de Trabajo
      { wch: 15 }, // Código Tipo Permiso
      { wch: 25 }, // Tipo de Permiso
      { wch: 16 }, // Fecha Inicio
      { wch: 16 }, // Fecha Finalización
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 16 }, // Fecha Compensación
      { wch: 18 }, // Requiere Reemplazo
      { wch: 20 }, // Nombre Reemplazante
      { wch: 18 }, // Días/Horas de Permiso
      { wch: 15 }, // Estado
      { wch: 40 }, // Motivo/Observación
      { wch: 30 }, // Comentarios RH
      { wch: 12 }, // Cantidad Evidencias
      { wch: 40 }, // Archivos Adjuntos
      { wch: 18 }, // Fecha Solicitud
      { wch: 18 }, // Fecha Actualización
      { wch: 20 }  // Fecha Actualización RH
    ]
    dataSheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, dataSheet, 'datos licencias')

    // Generar nombre de archivo con fecha
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `Reporte_Licencias_${timestamp}.xlsx`

    // Generar archivo y descargar
    XLSX.writeFile(workbook, fileName)
    
    console.log('✅ Reporte generado exitosamente:', fileName)
    return { success: true, fileName }

  } catch (error: any) {
    console.error('❌ Error generando reporte:', error)
    throw error
  }
}

// Funciones auxiliares para formatear datos
function formatDocumentType(type: string): string {
  const types: { [key: string]: string } = {
    'cedula': 'Cédula de Ciudadanía',
    'cedula_extranjeria': 'Cédula de Extranjería',
    'pasaporte': 'Pasaporte',
    'tarjeta_identidad': 'Tarjeta de Identidad'
  }
  return types[type] || type || 'N/A'
}

function formatStatus(status: string): string {
  const statuses: { [key: string]: string } = {
    'pendiente': 'Pendiente',
    'en_revision': 'En Revisión',
    'aprobada': 'Aprobada',
    'rechazada': 'Rechazada',
    // Compatibilidad con formatos anteriores
    'aprobado': 'Aprobada',
    'rechazado': 'Rechazada',
    'pending': 'Pendiente',
    'approved': 'Aprobada',
    'rejected': 'Rechazada'
  }
  return statuses[status] || status || 'N/A'
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('es-CO')
  } catch {
    return dateString
  }
}

function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString('es-CO')
  } catch {
    return dateString
  }
}

function calculateDaysDifference(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return 0
  }
}

function formatPermisoType(codigo: string): string {
  const tipos: { [key: string]: string } = {
    'PR': 'Permiso Remunerado',
    'PNR': 'Permiso No Remunerado',
    'PEPS': 'Permiso de Salud',
    'PCAP': 'Permiso para Capacitación',
    'PM': 'Permiso por Maternidad',
    'PC': 'Permiso por Calamidad',
    'PD': 'Permiso por Duelo/Luto',
    'PMT': 'Permiso por Matrimonio',
    'PLR': 'Permiso Lactancia Remunerado',
    'PLNR': 'Permiso Lactancia No Remunerado',
    'CMS': 'Comisión',
    'OTRO': 'Otro'
  }
  return tipos[codigo] || codigo || 'N/A'
}

function calculatePermisoDuration(fechaInicio: string, fechaFin: string, horaInicio?: string, horaFin?: string): string {
  if (!fechaInicio || !fechaFin) return 'N/A'
  
  try {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    // Si las fechas son iguales y hay horas, es un permiso por horas
    if (inicio.toDateString() === fin.toDateString() && horaInicio && horaFin) {
      const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number)
      const [finHoras, finMinutos] = horaFin.split(':').map(Number)
      
      const inicioTotalMinutos = inicioHoras * 60 + inicioMinutos
      const finTotalMinutos = finHoras * 60 + finMinutos
      const diferenciaMinutos = finTotalMinutos - inicioTotalMinutos
      
      if (diferenciaMinutos >= 60) {
        const horas = Math.floor(diferenciaMinutos / 60)
        const minutos = diferenciaMinutos % 60
        return minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`
      } else {
        return `${diferenciaMinutos}m`
      }
    }
    
    // Si no, calculamos días
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1 ? '1 día' : `${diffDays} días`
  } catch {
    return 'N/A'
  }
}
