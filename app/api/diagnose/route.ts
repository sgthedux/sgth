import { createClient } from "@/lib/supabase/admin" // Usando el cliente de admin con la SERVICE_ROLE_KEY
import { NextResponse } from "next/server"

export async function GET() {
  console.log("API Diagnose: Running diagnostics...")

  const supabase = createClient()

  try {
    // 1. Intentar leer de 'license_requests' con el cliente de admin
    console.log("API Diagnose: Attempting to select from license_requests...")
    const { data, error } = await supabase
      .from("license_requests")
      .select("id, status, created_at") // Seleccionando la columna problemática
      .limit(5)

    if (error) {
      console.error("API Diagnose: Error fetching from license_requests:", JSON.stringify(error, null, 2))
      return NextResponse.json(
        {
          success: false,
          message: "Error fetching from license_requests with admin client.",
          error: error,
        },
        { status: 500 },
      )
    }

    console.log("API Diagnose: Successfully fetched from license_requests.")
    return NextResponse.json({
      success: true,
      message: "Successfully connected and fetched from license_requests using admin client.",
      data: data,
    })
  } catch (e: any) {
    console.error("API Diagnose: Unexpected exception:", e)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected exception occurred.",
        error: e.message,
      },
      { status: 500 },
    )
  }
}
