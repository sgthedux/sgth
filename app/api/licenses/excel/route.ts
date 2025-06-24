import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

// Mapeo de códigos de permisos a coordenadas de Excel (según la plantilla real)
const PERMISO_COORDS: Record<string, string> = {
  "PR": "B13",   // Permiso Remunerado
  "PNR": "D13",  // Permiso No Remunerado  
  "PEPS": "F13", // Permiso de Salud
  "PCAP": "H13", // Permiso para Capacitación
  "PM": "J13",   // Permiso por Maternidad
  "PC": "L13",   // Permiso por Calamidad
  "PD": "B14",   // Permiso por Duelo/Luto
  "PMT": "D14",  // Permiso por Matrimonio
  "PLR": "F14",  // Permiso Lactancia Remunerado
  "PLNR": "H14", // Permiso Lactancia No Remunerado
  "CMS": "J14",  // Comisión
  "OTRO": "L14"  // Otro
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} de ${month} de ${year}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseId = searchParams.get('id')

    if (!licenseId) {
      return NextResponse.json({ error: 'ID de licencia requerido' }, { status: 400 })
    }

    console.log(`📊 [API /excel] Generando Excel para licencia ID: ${licenseId}`)

    const supabase = await createClient()
    
    // Obtener datos de la licencia
    const { data: licenseData, error } = await supabase
      .from('license_requests')
      .select('*')
      .eq('id', licenseId)
      .single()

    if (error || !licenseData) {
      console.error('❌ [API /excel] Error obteniendo datos:', error)
      return NextResponse.json({ error: 'Licencia no encontrada' }, { status: 404 })
    }

    console.log(`✅ [API /excel] Datos obtenidos para: ${licenseData.nombres} ${licenseData.apellidos}`)

    // Cargar la plantilla Excel desde public/
    const templatePath = path.join(process.cwd(), 'public', 'plantilla-licencias.xlsx')
    
    if (!fs.existsSync(templatePath)) {
      console.error('❌ [API /excel] Plantilla no encontrada en:', templatePath)
      return NextResponse.json({ error: 'Plantilla de Excel no encontrada' }, { status: 500 })
    }

    console.log(`📄 [API /excel] Cargando plantilla desde: ${templatePath}`)

    // Cargar la plantilla
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    
    // Obtener la primera hoja de trabajo
    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      console.error('❌ [API /excel] No se encontró hoja de trabajo en la plantilla')
      return NextResponse.json({ error: 'Error en la plantilla de Excel' }, { status: 500 })
    }    console.log(`📝 [API /excel] Rellenando datos en la plantilla`)

    // Rellenar los datos respetando la estructura de la plantilla
    // Nota: La plantilla tiene celdas combinadas, por lo que actualizamos la celda principal
    
    // Número consecutivo (reemplazar el contenido existente)
    const radicadoCell = worksheet.getCell('A4')
    if (radicadoCell) {
      radicadoCell.value = `Nº Consecutivo: ${licenseData.radicado}`
    }
    
    // Fecha de solicitud (reemplazar el contenido existente)
    const fechaSolicitudCell = worksheet.getCell('F4')
    if (fechaSolicitudCell) {
      fechaSolicitudCell.value = `Fecha de Solicitud: ${formatDate(licenseData.created_at)}`
    }
    
    // Horas (reemplazar contenido existente si hay datos)
    if (licenseData.hora_inicio) {
      const horaInicioCell = worksheet.getCell('A5')
      if (horaInicioCell) {
        horaInicioCell.value = `Hora inicio: ${licenseData.hora_inicio}`
      }
    }
    
    if (licenseData.hora_fin) {
      const horaFinCell = worksheet.getCell('F5')
      if (horaFinCell) {
        horaFinCell.value = `Hora Finalización: ${licenseData.hora_fin}`
      }
    }
    
    // Fechas de inicio y finalización (reemplazar contenido existente)
    const fechaInicioCell = worksheet.getCell('A6')
    if (fechaInicioCell) {
      fechaInicioCell.value = `Fecha inicio: ${formatDate(licenseData.fecha_inicio)}`
    }
    
    const fechaFinCell = worksheet.getCell('F6')
    if (fechaFinCell) {
      fechaFinCell.value = `Fecha Finalización: ${formatDate(licenseData.fecha_finalizacion)}`
    }
    
    // Fecha de compensación (reemplazar contenido si aplica)
    const fechaCompensacionCell = worksheet.getCell('A7')
    if (fechaCompensacionCell && licenseData.fecha_compensacion) {
      fechaCompensacionCell.value = `Fecha en la cual se compensará el permiso: ${formatDate(licenseData.fecha_compensacion)}`
    }

    // Información personal (reemplazar contenido existente)
    const nombreCell = worksheet.getCell('A8')
    if (nombreCell) {
      nombreCell.value = `Nombre del Funcionario: ${licenseData.nombres} ${licenseData.apellidos}`
    }
    
    const cedulaCell = worksheet.getCell('J8')
    if (cedulaCell) {
      cedulaCell.value = `C.C: ${licenseData.numero_documento}`
    }
    
    // Área de trabajo (reemplazar contenido existente)
    const areaCell = worksheet.getCell('A9')
    if (areaCell) {
      if (licenseData.area_trabajo) {
        areaCell.value = `Área de trabajo: ${licenseData.area_trabajo}`
      } else {
        areaCell.value = `Área de trabajo: `
      }
    }
    
    // Cargo (reemplazar contenido existente)
    const cargoCell = worksheet.getCell('A10')
    if (cargoCell) {
      cargoCell.value = `Cargo: ${licenseData.cargo}`
    }

    // Reemplazo (reemplazar contenido existente)
    const reemplazoCell = worksheet.getCell('A11')
    if (reemplazoCell) {
      if (licenseData.reemplazo) {
        reemplazoCell.value = `Reemplazo: SI_X NO__ Nombre del Reemplazante: ${licenseData.reemplazante || ''}`
      } else {
        reemplazoCell.value = `Reemplazo: SI__ NO_X Nombre del Reemplazante:`
      }
    }

    // Limpiar todas las marcas de tipos de permiso primero
    Object.values(PERMISO_COORDS).forEach(coord => {
      const cell = worksheet.getCell(coord)
      if (cell) {
        cell.value = ''
      }
    })

    // Marcar el tipo de permiso correspondiente
    if (licenseData.codigo_tipo_permiso && PERMISO_COORDS[licenseData.codigo_tipo_permiso as string]) {
      const coord = PERMISO_COORDS[licenseData.codigo_tipo_permiso as string]
      const permisoCell = worksheet.getCell(coord)
      if (permisoCell) {
        permisoCell.value = 'X'
        permisoCell.font = { bold: true }
      }
    }

    // Motivo (reemplazar contenido existente)
    const motivoCell = worksheet.getCell('A15')
    if (motivoCell) {
      motivoCell.value = `MOTIVO DEL PERMISO: ${licenseData.observacion}`
    }

    console.log(`✅ [API /excel] Datos completados en la plantilla`)

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Configurar headers para descarga
    const fileName = `Licencia_${licenseData.radicado}_${licenseData.nombres}_${licenseData.apellidos}.xlsx`
    
    console.log(`📤 [API /excel] Enviando archivo: ${fileName}`)
    
    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error: any) {
    console.error('💥 [API /excel] Error generando Excel:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
