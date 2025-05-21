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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      console.error("Error: SUPABASE_SERVICE_ROLE_KEY no está configurada")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Recopilar toda la información disponible del usuario
    let userData = {
      user_id: userId,
      email: "",
      full_name: "Usuario",
    }

    // Intentar obtener el perfil
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      // Continuamos con la información básica
    } else if (profileData) {
      userData = {
        ...userData,
        email: profileData.email || userData.email,
        full_name: profileData.full_name || userData.full_name,
      }
      console.log("Perfil encontrado:", profileData)
    } else {
      console.log("No se encontró perfil, usando información básica")
    }

    // Intentar obtener información personal
    const { data: personalInfoData, error: personalInfoError } = await supabase
      .from("personal_info")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (personalInfoError) {
      console.error("Error al obtener información personal:", personalInfoError)
    } else if (personalInfoData) {
      userData = {
        ...userData,
        ...personalInfoData,
      }
      console.log("Información personal encontrada:", personalInfoData)
    } else {
      console.log("No se encontró información personal, usando información básica")
    }

    // Obtener educación
    const { data: education, error: educationError } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)

    if (educationError) {
      console.error("Error al obtener educación:", educationError)
    } else {
      console.log(`Se encontraron ${education?.length || 0} registros de educación:`, education)
    }

    // Obtener experiencia
    const { data: experience, error: experienceError } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", userId)

    if (experienceError) {
      console.error("Error al obtener experiencia:", experienceError)
    } else {
      console.log(`Se encontraron ${experience?.length || 0} registros de experiencia:`, experience)
    }

    // Obtener idiomas
    const { data: languages, error: languagesError } = await supabase
      .from("languages")
      .select("*")
      .eq("user_id", userId)

    if (languagesError) {
      console.error("Error al obtener idiomas:", languagesError)
    } else {
      console.log(`Se encontraron ${languages?.length || 0} registros de idiomas:`, languages)
    }

    // Generar el PDF con la información disponible
    console.log("Datos que se envían a generatePdf:", {
      userData,
      education: education || [],
      experience: experience || [],
      languages: languages || [],
    })

    const pdfBytes = await generatePdf(userData, education || [], experience || [], languages || [])

    // Generar un nombre único para el archivo
    const timestamp = new Date().getTime()
    const fileName = `hoja_de_vida_${userId}_${timestamp}.pdf`

    // Si encontramos un perfil, actualizarlo para indicar que se ha generado el CV
    if (profileData) {
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
