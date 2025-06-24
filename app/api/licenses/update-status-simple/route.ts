import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 [API UPDATE STATUS SIMPLE] Iniciando actualización de estado")

    const body = await request.json()
    const { licenseId, status, comments } = body

    // Validaciones básicas
    if (!licenseId || !status) {
      return NextResponse.json({
        success: false,
        error: "ID de licencia y estado son requeridos"
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

    console.log(`📝 [API UPDATE STATUS SIMPLE] Actualizando licencia ${licenseId} a estado: ${status}`)

    const supabase = await createClient()

    // Verificar que la licencia existe
    const { data: existingLicense, error: fetchError } = await supabase
      .from("license_requests")
      .select("radicado, nombres, apellidos")
      .eq("id", licenseId)
      .single()

    if (fetchError || !existingLicense) {
      console.error("❌ [API UPDATE STATUS SIMPLE] Licencia no encontrada:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Licencia no encontrada"
      }, { status: 404 })
    }

    // Preparar datos de actualización - solo lo esencial
    const updateData: { estado: string; comentarios_rh?: string } = {
      estado: status
    }

    if (comments?.trim()) {
      updateData.comentarios_rh = comments.trim()
    }

    console.log(`📋 [API UPDATE STATUS SIMPLE] Actualizando con:`, updateData)

    // Actualizar sin triggers - usando solo los campos básicos
    const { error: updateError } = await supabase
      .from("license_requests")
      .update(updateData)
      .eq("id", licenseId)

    if (updateError) {
      console.error("❌ [API UPDATE STATUS SIMPLE] Error actualizando:", updateError)
      return NextResponse.json({
        success: false,
        error: "Error al actualizar el estado de la licencia",
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ [API UPDATE STATUS SIMPLE] Estado actualizado exitosamente`)

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
    })

  } catch (error) {
    console.error("💥 [API UPDATE STATUS SIMPLE] Error crítico:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
