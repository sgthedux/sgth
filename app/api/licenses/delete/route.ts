import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { licenseId } = await request.json()

    if (!licenseId) {
      return NextResponse.json({ error: "License ID is required" }, { status: 400 })
    }

    console.log(`API Delete License: Starting deletion for license ID ${licenseId}`)

    // Crear cliente de Supabase con permisos del servidor
    const supabase = await createClient()

    // 1. Obtener evidencias asociadas para logging
    const { data: evidences, error: evidencesError } = await supabase
      .from("license_evidences")
      .select("id, file_path")
      .eq("license_request_id", licenseId)

    if (evidencesError) {
      console.error("API Delete License: Error fetching evidences:", evidencesError)
      return NextResponse.json(
        { error: "Error fetching evidences", details: evidencesError.message },
        { status: 500 }
      )
    }

    console.log(`API Delete License: Found ${evidences?.length || 0} evidences to delete:`, evidences)

    // 2. Eliminar evidencias de la base de datos
    if (evidences && evidences.length > 0) {
      const { error: deleteEvidencesError } = await supabase
        .from("license_evidences")
        .delete()
        .eq("license_request_id", licenseId)

      if (deleteEvidencesError) {
        console.error("API Delete License: Error deleting evidences from database:", deleteEvidencesError)
        return NextResponse.json(
          { error: "Error deleting evidences from database", details: deleteEvidencesError.message },
          { status: 500 }
        )
      }

      console.log(`API Delete License: Successfully deleted ${evidences.length} evidences from database`)
    }

    // 3. Eliminar la solicitud principal
    const { error: deleteRequestError } = await supabase
      .from("license_requests")
      .delete()
      .eq("id", licenseId)

    if (deleteRequestError) {
      console.error("API Delete License: Error deleting license request from database:", deleteRequestError)
      return NextResponse.json(
        { error: "Error deleting license request from database", details: deleteRequestError.message },
        { status: 500 }
      )
    }

    console.log(`API Delete License: Successfully deleted license request ${licenseId} from database`)

    // 4. Devolver las rutas de archivos para que el cliente las elimine de R2
    const filePaths = evidences?.map((e: any) => e.file_path).filter(Boolean) || []

    return NextResponse.json({
      success: true,
      message: `License ${licenseId} deleted successfully`,
      filePaths: filePaths
    })

  } catch (error) {
    console.error("API Delete License: Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to delete license", details: errorMessage },
      { status: 500 }
    )
  }
}
