import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generatePdf } from "@/lib/pdf-generator"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID del usuario" }, { status: 400 })
    }

    console.log("Generando PDF para el usuario:", userId)

    // Crear cliente de Supabase con el rol de servicio para tener permisos completos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Obtener datos del usuario
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId)

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return NextResponse.json({ error: `Error al obtener perfil: ${profileError.message}` }, { status: 500 })
    }

    // Obtener información personal
    const { data: personalInfoData, error: personalInfoError } = await supabase
      .from("personal_info")
      .select("*")
      .eq("user_id", userId)

    let personalInfo = null
    if (personalInfoError) {
      console.error("Error al obtener información personal:", personalInfoError)
    } else if (personalInfoData && personalInfoData.length > 0) {
      personalInfo = personalInfoData[0]
      console.log("Información personal encontrada")
    }

    // Obtener educación
    const { data: education, error: educationError } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)

    if (educationError) {
      console.error("Error al obtener educación:", educationError)
    } else {
      console.log(`Se encontraron ${education?.length || 0} registros de educación`)
    }

    // Obtener experiencia
    const { data: experience, error: experienceError } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", userId)

    if (experienceError) {
      console.error("Error al obtener experiencia:", experienceError)
    } else {
      console.log(`Se encontraron ${experience?.length || 0} registros de experiencia`)
    }

    // Obtener idiomas
    const { data: languages, error: languagesError } = await supabase
      .from("languages")
      .select("*")
      .eq("user_id", userId)

    if (languagesError) {
      console.error("Error al obtener idiomas:", languagesError)
    } else {
      console.log(`Se encontraron ${languages?.length || 0} registros de idiomas`)
    }

    // Si no tenemos información personal pero tenemos perfil, usamos los datos del perfil
    if (!personalInfo && profileData && profileData.length > 0) {
      const profile = profileData[0]
      personalInfo = {
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name,
      }
    }

    // Si aún no tenemos información personal, intentamos obtenerla de auth.users
    if (!personalInfo) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)
      } else if (userData && userData.user) {
        personalInfo = {
          user_id: userId,
          email: userData.user.email,
          full_name: userData.user.user_metadata?.full_name,
        }
      }
    }

    if (!personalInfo) {
      return NextResponse.json({ error: "No se encontró información del usuario" }, { status: 404 })
    }

    // Generar el PDF
    const pdfBytes = await generatePdf(personalInfo, education || [], experience || [], languages || [])

    // Generar un nombre único para el archivo
    const timestamp = new Date().getTime()
    const fileName = `hoja_de_vida_${userId}_${timestamp}.pdf`

    // Actualizar el perfil para indicar que se ha generado el CV
    if (profileData && profileData.length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_generated: true,
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error al actualizar el perfil:", updateError)
      }
    }

    // Devolver el PDF como respuesta
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: error.message || "Error al generar el PDF" }, { status: 500 })
  }
}
