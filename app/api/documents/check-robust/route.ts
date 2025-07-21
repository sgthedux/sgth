import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get("userId")
    const documentType = searchParams.get("documentType")
    const itemId = searchParams.get("itemId")
    
    if (!userId || !documentType || !itemId) {
      return NextResponse.json({ 
        error: "Missing required parameters" 
      }, { status: 400 })
    }

    // Verificar si existe el documento
    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("type", documentType)
      .eq("item_id", itemId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking document:", error)
      return NextResponse.json({ 
        error: "Error checking document" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      exists: !!document,
      url: document?.url || null,
      name: document?.name || null,
      document: document || null 
    })
  } catch (error) {
    console.error("Error in check-robust endpoint:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
