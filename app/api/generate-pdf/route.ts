import { NextResponse } from "next/server"
import { generatePdf } from "@/lib/pdf-generator"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID del usuario" }, { status: 400 })
    }

    console.log("Generando PDF para el usuario:", userId)

    // Crear cliente de Supabase del servidor
    const supabase = await createClient()
    
    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Usuario no autenticado:", authError)
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }
    
    // Verificar que el usuario pueda acceder a los datos (mismo usuario o admin)
    if (user.id !== userId) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (!profile || profile.role !== "admin") {
        console.error("Usuario no tiene permisos para generar PDF de otro usuario")
        return NextResponse.json({ error: "No tienes permisos para generar este PDF" }, { status: 403 })
      }
    }

    // Obtener datos del usuario
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return NextResponse.json({ error: `Error al obtener perfil: ${profileError.message}` }, { status: 500 })
    }

    if (!profileData) {
      console.error("No se encontró perfil para el usuario:", userId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("Perfil encontrado:", { id: profileData.id, email: profileData.email, full_name: profileData.full_name })

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
    if (!personalInfo && profileData) {
      personalInfo = {
        user_id: userId,
        email: profileData.email,
        full_name: profileData.full_name,
      }
    }

    // Si aún no tenemos información personal, crear un objeto mínimo con los datos disponibles
    if (!personalInfo) {
      console.log("No se encontró información personal específica, usando datos básicos del perfil")
      personalInfo = {
        user_id: userId,
        email: profileData ? profileData.email : null,
        full_name: profileData ? profileData.full_name : null,
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
    if (profileData) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_generated: true,
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error al actualizar el perfil:", updateError)
      } else {
        console.log("Perfil actualizado: cv_generated = true")
      }
    }

    // Devolver el PDF como respuesta
    return new NextResponse(new Uint8Array(pdfBytes), {
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