import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 [API UPDATE STATUS V2] Iniciando actualización de estado (versión segura)")

    const body = await request.json()
    const { licenseId, status, comments } = body

    // Validaciones
    if (!licenseId) {
      return NextResponse.json({
        success: false,
        error: "ID de licencia es requerido"
      }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({
        success: false,
        error: "Estado es requerido"
      }, { status: 400 })
    }

    // Validar estados permitidos
    const validStates = ["pendiente", "en_revision", "aprobada", "rechazada", "cancelada"]
    if (!validStates.includes(status)) {
      return NextResponse.json({
        success: false,
        error: "Estado no válido"
      }, { status: 400 })
    }

    console.log(`📝 [API UPDATE STATUS V2] Actualizando licencia ${licenseId} a estado: ${status}`)

    const supabase = await createClient()

    // Verificar que la licencia existe
    const { data: existingLicense, error: fetchError } = await supabase
      .from("license_requests")
      .select("id, radicado, nombres, apellidos, estado")
      .eq("id", licenseId)
      .single()

    if (fetchError || !existingLicense) {
      console.error("❌ [API UPDATE STATUS V2] Error obteniendo licencia:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Licencia no encontrada"
      }, { status: 404 })
    }

    console.log(`✅ [API UPDATE STATUS V2] Licencia encontrada: ${existingLicense.radicado}`)

    // Preparar datos de actualización básicos
    const updateData: any = {
      estado: status
    }

    // Agregar comentarios si se proporcionan
    if (comments && comments.trim()) {
      updateData.comentarios_rh = comments.trim()
    }

    // Verificar qué campos de fecha existen y usar el apropiado
    const { data: tableInfo, error: columnError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'license_requests' 
          AND column_name IN ('fecha_actualizacion', 'updated_at')
        `
      })

    // Si no podemos verificar columnas, intentar con updated_at como fallback
    if (!columnError && tableInfo) {
      const availableColumns = tableInfo.map((row: any) => row.column_name)
      if (availableColumns.includes('fecha_actualizacion')) {
        updateData.fecha_actualizacion = new Date().toISOString()
      } else if (availableColumns.includes('updated_at')) {
        updateData.updated_at = new Date().toISOString()
      }
    }

    console.log(`📋 [API UPDATE STATUS V2] Datos a actualizar:`, updateData)

    // Realizar la actualización
    const { data: updatedLicense, error: updateError } = await supabase
      .from("license_requests")
      .update(updateData)
      .eq("id", licenseId)
      .select("*")
      .single()

    if (updateError) {
      console.error("❌ [API UPDATE STATUS V2] Error actualizando estado:", updateError)
      return NextResponse.json({
        success: false,
        error: "Error al actualizar el estado de la licencia",
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`🎉 [API UPDATE STATUS V2] Estado actualizado exitosamente`)

    // Mapeo de estados para el mensaje de respuesta
    const statusLabels: { [key: string]: string } = {
      pendiente: "pendiente",
      en_revision: "en revisión", 
      aprobada: "aprobada",
      rechazada: "rechazada",
      cancelada: "cancelada"
    }

    return NextResponse.json({
      success: true,
      message: `La licencia ${existingLicense.radicado} ha sido ${statusLabels[status]}`,
      data: updatedLicense
    })

  } catch (error) {
    console.error("💥 [API UPDATE STATUS V2] Error crítico:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
