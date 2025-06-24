import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    console.log("📊 [API REPORTE] Iniciando generación de reporte general")

    const supabase = await createClient()
    
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
      console.error('❌ [API REPORTE] Error al obtener datos:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de licencias',
        details: error.message
      }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay datos de licencias para generar el reporte'
      }, { status: 404 })
    }

    console.log(`📋 [API REPORTE] Procesando ${data.length} registros`)

    // Crear libro de trabajo Excel
    const workbook = new ExcelJS.Workbook()
    
    // Configurar metadatos del archivo
    workbook.creator = 'Sistema SGTH - Recursos Humanos'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.lastPrinted = new Date()

    // Hoja 1: Resumen/Estadísticas
    const resumenSheet = workbook.addWorksheet('Resumen')
    
    // Calcular estadísticas
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const thisMonthData = data.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
    })

    const stats = [
      ['Concepto', 'Valor'],
      ['Total Solicitudes', data.length],
      ['Pendientes', data.filter(item => item.estado === 'pendiente').length],
      ['En Revisión', data.filter(item => item.estado === 'en_revision').length],
      ['Aprobadas', data.filter(item => item.estado === 'aprobada').length],
      ['Rechazadas', data.filter(item => item.estado === 'rechazada').length],
      ['Solicitudes Este Mes', thisMonthData.length],
      ['Aprobadas Este Mes', thisMonthData.filter(item => item.estado === 'aprobada').length],
      ['Fecha Generación', new Date().toLocaleString('es-CO')],
      ['Generado Por', 'Sistema SGTH - Recursos Humanos']
    ]

    resumenSheet.addRows(stats)
    resumenSheet.getRow(1).font = { bold: true }
    resumenSheet.columns = [
      { width: 25 },
      { width: 20 }
    ]

    // Hoja 2: Datos completos (con el nombre exacto que solicitas)
    const datosSheet = workbook.addWorksheet('datos licencias')
    
    // Encabezados
    const headers = [
      'Radicado', 'Nombres', 'Apellidos', 'Tipo Documento', 'Número Documento',
      'Cargo', 'Área de Trabajo', 'Código Tipo Permiso', 'Tipo de Permiso',
      'Fecha Inicio', 'Fecha Finalización', 'Hora Inicio', 'Hora Fin',
      'Fecha Compensación', 'Requiere Reemplazo', 'Nombre Reemplazante',
      'Días/Horas de Permiso', 'Estado', 'Motivo/Observación', 'Comentarios RH',
      'Cantidad Evidencias', 'Archivos Adjuntos', 'Fecha Solicitud',
      'Fecha Actualización', 'Fecha Actualización RH'
    ]
    
    datosSheet.addRow(headers)
    datosSheet.getRow(1).font = { bold: true }
    
    // Formatear y agregar datos
    const formattedData = data.map((item: any) => [
      item.radicado || 'N/A',
      item.nombres || 'N/A',
      item.apellidos || 'N/A',
      formatDocumentType(item.tipo_documento),
      item.numero_documento || 'N/A',
      item.cargo || 'N/A',
      item.area_trabajo || 'N/A',
      item.codigo_tipo_permiso || 'N/A',
      formatPermisoType(item.codigo_tipo_permiso),
      formatDate(item.fecha_inicio),
      formatDate(item.fecha_finalizacion),
      item.hora_inicio || 'N/A',
      item.hora_fin || 'N/A',
      item.fecha_compensacion ? formatDate(item.fecha_compensacion) : 'N/A',
      item.reemplazo ? 'SÍ' : 'NO',
      item.reemplazante || 'N/A',
      calculatePermisoDuration(item.fecha_inicio, item.fecha_finalizacion, item.hora_inicio, item.hora_fin),
      formatStatus(item.estado),
      item.observacion || 'N/A',
      item.comentarios_rh || 'N/A',
      item.evidences?.length || 0,
      item.evidences?.map((e: any) => e.file_name).join(', ') || 'Sin archivos',
      formatDateTime(item.created_at),
      formatDateTime(item.updated_at),
      item.fecha_actualizacion ? formatDateTime(item.fecha_actualizacion) : 'N/A'
    ])

    datosSheet.addRows(formattedData)
    
    // Configurar ancho de columnas
    datosSheet.columns = [
      { width: 18 }, { width: 15 }, { width: 15 }, { width: 18 }, { width: 15 },
      { width: 25 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 16 },
      { width: 16 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 18 },
      { width: 20 }, { width: 18 }, { width: 15 }, { width: 40 }, { width: 30 },
      { width: 12 }, { width: 40 }, { width: 18 }, { width: 18 }, { width: 20 }
    ]

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Generar nombre de archivo con fecha
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `Reporte_General_Licencias_${timestamp}.xlsx`
    
    console.log(`✅ [API REPORTE] Reporte generado: ${fileName}`)
    
    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error: any) {
    console.error('💥 [API REPORTE] Error generando reporte:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}

// Funciones auxiliares
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
    'cancelada': 'Cancelada'
  }
  return statuses[status] || status || 'N/A'
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
