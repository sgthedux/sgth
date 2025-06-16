import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const dataType = searchParams.get("type") || "all"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verificar que el usuario solo pueda acceder a sus propios datos o sea admin
    if (user.id !== userId) {
      // Verificar si es admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

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

        result = languages || []
        break

      case "all":
      default:
        // Obtener todos los datos
        const [personalRes, educationRes, experienceRes, languagesRes] = await Promise.allSettled([
          supabase.from("personal_info").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("education").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
          supabase.from("experience").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
          supabase.from("languages").select("*").eq("user_id", userId),
        ])

        result = {
          personalInfo: personalRes.status === "fulfilled" && !personalRes.value.error ? personalRes.value.data : null,
          education:
            educationRes.status === "fulfilled" && !educationRes.value.error ? educationRes.value.data || [] : [],
          experience:
            experienceRes.status === "fulfilled" && !experienceRes.value.error ? experienceRes.value.data || [] : [],
          languages:
            languagesRes.status === "fulfilled" && !languagesRes.value.error ? languagesRes.value.data || [] : [],
        }
        break
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("Error in profile-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
