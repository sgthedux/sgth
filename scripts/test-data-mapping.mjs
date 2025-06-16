import { createClient } from "@supabase/supabase-js"

async function testDataMapping() {
  try {
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    console.log("🔍 Revisando estructura de datos en las tablas...")

    // Obtener un usuario de ejemplo
    const { data: profiles } = await supabase.from("profiles").select("*").limit(1)
    if (profiles && profiles.length > 0) {
      console.log("\n📊 Estructura de profiles:")
      console.log("Campos disponibles:", Object.keys(profiles[0]))
      console.log("Datos de ejemplo:", profiles[0])

      const userId = profiles[0].id

      // Obtener personal_info
      const { data: personalInfo } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", userId)
        .limit(1)

      if (personalInfo && personalInfo.length > 0) {
        console.log("\n📊 Estructura de personal_info:")
        console.log("Campos disponibles:", Object.keys(personalInfo[0]))
        console.log("Datos de ejemplo:", personalInfo[0])
      }

      // Obtener education
      const { data: education } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)
        .limit(3)

      if (education && education.length > 0) {
        console.log("\n📊 Estructura de education:")
        console.log("Campos disponibles:", Object.keys(education[0]))
        console.log("Datos de ejemplo:", education[0])
      }

      // Obtener experience
      const { data: experience } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", userId)
        .limit(3)

      if (experience && experience.length > 0) {
        console.log("\n📊 Estructura de experience:")
        console.log("Campos disponibles:", Object.keys(experience[0]))
        console.log("Datos de ejemplo:", experience[0])
      }

      // Obtener languages
      const { data: languages } = await supabase
        .from("languages")
        .select("*")
        .eq("user_id", userId)
        .limit(3)

      if (languages && languages.length > 0) {
        console.log("\n📊 Estructura de languages:")
        console.log("Campos disponibles:", Object.keys(languages[0]))
        console.log("Datos de ejemplo:", languages[0])
      }

      // Simular el objeto combinado que se pasa al PDF
      const completeUserData = {
        // Datos de personal_info
        ...(personalInfo && personalInfo.length > 0 ? personalInfo[0] : {}),
        // Datos adicionales del perfil
        ...profiles[0],
      }

      console.log("\n🔄 Objeto combinado que se pasaría al PDF:")
      console.log("Campos disponibles:", Object.keys(completeUserData))
      console.log("Datos completos:", completeUserData)
    } else {
      console.log("❌ No se encontraron perfiles en la base de datos")
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testDataMapping()
