/**
 * Script para probar la generación de PDF y ver los datos que se están recibiendo
 */

const { createClient } = require("@supabase/supabase-js")

async function testPdfGeneration() {
  try {
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Primero obtener algunos IDs de usuarios existentes
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .limit(5)

    if (profilesError) {
      console.error("Error obteniendo perfiles:", profilesError)
      return
    }

    console.log("Perfiles encontrados:", profiles)

    if (profiles && profiles.length > 0) {
      const userId = profiles[0].id
      console.log("\n=== PROBANDO CON USUARIO:", userId, "===")

      // Obtener datos del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)

      console.log("Profile data:", JSON.stringify(profileData, null, 2))

      // Obtener información personal
      const { data: personalInfoData, error: personalInfoError } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", userId)

      console.log("Personal info data:", JSON.stringify(personalInfoData, null, 2))

      // Obtener educación
      const { data: education, error: educationError } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)

      console.log("Education data:", JSON.stringify(education, null, 2))

      // Obtener experiencia
      const { data: experience, error: experienceError } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", userId)

      console.log("Experience data:", JSON.stringify(experience, null, 2))

      // Obtener idiomas
      const { data: languages, error: languagesError } = await supabase
        .from("languages")
        .select("*")
        .eq("user_id", userId)

      console.log("Languages data:", JSON.stringify(languages, null, 2))

      // Simular la lógica de combinación de datos
      let personalInfo = null
      if (personalInfoData && personalInfoData.length > 0) {
        personalInfo = personalInfoData[0]
      } else if (profileData && profileData.length > 0) {
        const profile = profileData[0]
        personalInfo = {
          user_id: userId,
          email: profile.email,
          full_name: profile.full_name,
        }
      }

      const completeUserData = {
        ...personalInfo,
        ...(profileData && profileData.length > 0 ? profileData[0] : {}),
      }

      console.log("\n=== DATOS COMBINADOS PARA PDF ===")
      console.log("Complete user data:", JSON.stringify(completeUserData, null, 2))
      console.log("Available keys:", Object.keys(completeUserData))
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

// Ejecutar el test
testPdfGeneration()
