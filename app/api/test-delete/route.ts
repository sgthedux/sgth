import { NextResponse } from "next/server"
import { createClient } from "../../../lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { licenseId } = await request.json()

    if (!licenseId) {
      return NextResponse.json({ error: "License ID is required" }, { status: 400 })
    }

    console.log(`[TEST DELETE] Starting deletion for license ID: ${licenseId}`)

    const supabase = await createClient()

    // Verificar si la licencia existe
    const { data: license, error: selectError } = await supabase
      .from("license_requests")
      .select("id, radicado")
      .eq("id", licenseId)
      .single()

    if (selectError) {
      console.error("[TEST DELETE] Error selecting license:", selectError)
      return NextResponse.json({ 
        error: "Error finding license", 
        details: selectError.message 
      }, { status: 404 })
    }

    console.log(`[TEST DELETE] Found license:`, license)

    // Intentar eliminar
    const { error: deleteError } = await supabase
      .from("license_requests")
      .delete()
      .eq("id", licenseId)

    if (deleteError) {
      console.error("[TEST DELETE] Error deleting license:", deleteError)
      return NextResponse.json({ 
        error: "Error deleting license", 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log(`[TEST DELETE] Successfully deleted license ${licenseId}`)

    return NextResponse.json({
      success: true,
      message: `License ${licenseId} deleted successfully`,
      license: license
    })

  } catch (error) {
    console.error("[TEST DELETE] Unexpected error:", error)
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
