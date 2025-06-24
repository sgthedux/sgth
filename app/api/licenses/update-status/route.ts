import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 [API UPDATE STATUS] Iniciando actualización de estado")

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

    console.log(`📝 [API UPDATE STATUS] Actualizando licencia ${licenseId} a estado: ${status}`)

    const supabase = await createClient()

    // Verificar que la licencia existe
    const { data: existingLicense, error: fetchError } = await supabase
      .from("license_requests")
      .select("id, radicado, nombres, apellidos, estado")
      .eq("id", licenseId)
      .single()

    if (fetchError || !existingLicense) {
      console.error("❌ [API UPDATE STATUS] Error obteniendo licencia:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Licencia no encontrada"
      }, { status: 404 })
    }

    console.log(`✅ [API UPDATE STATUS] Licencia encontrada: ${existingLicense.radicado}`)

    // Mapeo de estados para los mensajes de respuesta
    const statusLabels: { [key: string]: string } = {
      pendiente: "pendiente",
      en_revision: "en revisión", 
      aprobada: "aprobada",
      rechazada: "rechazada",
      cancelada: "cancelada"
    }

    // Realizar la actualización usando UPDATE directo con SQL crudo para evitar triggers problemáticos
    const { data: updatedLicense, error: updateError } = await supabase
      .rpc('update_license_status', {
        license_id: licenseId,
        new_status: status,
        new_comments: comments?.trim() || null
      })

    if (updateError) {
      console.error("❌ [API UPDATE STATUS] Error con función RPC, intentando UPDATE directo:", updateError)
      
      // Fallback: intentar actualización directa simple
      const { data: fallbackUpdate, error: fallbackError } = await supabase
        .from("license_requests")
        .update({ 
          estado: status,
          ...(comments?.trim() && { comentarios_rh: comments.trim() })
        })
        .eq("id", licenseId)
        .select("*")
        .single()

      if (fallbackError) {
        console.error("❌ [API UPDATE STATUS] Error en fallback:", fallbackError)
        return NextResponse.json({
          success: false,
          error: "Error al actualizar el estado de la licencia",
          details: fallbackError.message
        }, { status: 500 })
      }

      console.log(`🎉 [API UPDATE STATUS] Estado actualizado con fallback`)
      
      return NextResponse.json({
        success: true,
        message: `La licencia ${existingLicense.radicado} ha sido ${statusLabels[status]}`,
        data: fallbackUpdate
      })
    }    console.log(`🎉 [API UPDATE STATUS] Estado actualizado exitosamente`)

    return NextResponse.json({
      success: true,
      message: `La licencia ${existingLicense.radicado} ha sido ${statusLabels[status]}`,
      data: updatedLicense
    })

  } catch (error) {
    console.error("💥 [API UPDATE STATUS] Error crítico:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
