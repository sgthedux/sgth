import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const dataType = searchParams.get("type") || "all"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verificar que las variables de entorno estén disponibles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Crear cliente administrativo
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Solicitando datos para usuario:", userId, "Tipo:", dataType)

    let result: any = {}

    switch (dataType) {
      case "personal_info":
        const { data: personalInfo, error: personalError } = await supabase
          .from("personal_info")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        if (personalError) {
          console.error("Error fetching personal info:", personalError)
          return NextResponse.json({ error: "Error fetching personal info" }, { status: 500 })
        }

        console.log("Personal info encontrada:", personalInfo ? "Sí" : "No")
        if (personalInfo) {
          console.log("Datos:", {
            first_name: personalInfo.first_name,
            first_surname: personalInfo.first_surname,
            identification_type: personalInfo.identification_type,
          })
        }
        result = personalInfo
        break

      case "education":
        const { data: education, error: educationError } = await supabase
          .from("education")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })

        if (educationError) {
          console.error("Error fetching education:", educationError)
          return NextResponse.json({ error: "Error fetching education" }, { status: 500 })
        }

        console.log("Education records found:", education?.length || 0)
        result = education || []
        break

      case "experience":
        const { data: experience, error: experienceError } = await supabase
          .from("experience")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })

        if (experienceError) {
          console.error("Error fetching experience:", experienceError)
          return NextResponse.json({ error: "Error fetching experience" }, { status: 500 })
        }

        console.log("Experience records found:", experience?.length || 0)
        result = experience || []
        break

      case "languages":
        const { data: languages, error: languagesError } = await supabase
          .from("languages")
          .select("*")
          .eq("user_id", userId)

        if (languagesError) {
          console.error("Error fetching languages:", languagesError)
          return NextResponse.json({ error: "Error fetching languages" }, { status: 500 })
        }

        console.log("Language records found:", languages?.length || 0)
        result = languages || []
        break

      case "all":
      default:
        // Obtener todos los datos de forma secuencial
        try {
          console.log("Fetching all data for user:", userId)

          const { data: personalInfo, error: personalError } = await supabase
            .from("personal_info")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()

          if (personalError) {
            console.error("Error in personal_info:", personalError)
          }

          const { data: education, error: educationError } = await supabase
            .from("education")
            .select("*")
            .eq("user_id", userId)
            .order("start_date", { ascending: false })

          if (educationError) {
            console.error("Error in education:", educationError)
          }

          const { data: experience, error: experienceError } = await supabase
            .from("experience")
            .select("*")
            .eq("user_id", userId)
            .order("start_date", { ascending: false })

          if (experienceError) {
            console.error("Error in experience:", experienceError)
          }

          const { data: languages, error: languagesError } = await supabase
            .from("languages")
            .select("*")
            .eq("user_id", userId)

          if (languagesError) {
            console.error("Error in languages:", languagesError)
          }

          result = {
            personalInfo: personalInfo || null,
            education: education || [],
            experience: experience || [],
            languages: languages || [],
          }

          console.log("All data fetched:", {
            hasPersonalInfo: !!personalInfo,
            educationCount: education?.length || 0,
            experienceCount: experience?.length || 0,
            languagesCount: languages?.length || 0,
          })
        } catch (error) {
          console.error("Error fetching all data:", error)
          return NextResponse.json({ error: "Error fetching profile data" }, { status: 500 })
        }
        break
    }

    return NextResponse.json({ data: result, success: true })
  } catch (error) {
    console.error("Error in profile-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
