const { createClient } = require("@supabase/supabase-js")

// Configurar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

async function analyzeUserData() {
  try {
    console.log("=== ANÁLISIS DE ESTRUCTURA DE DATOS ===\n")

    // Obtener un usuario de ejemplo (el primero disponible)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)

    if (profilesError) {
      console.error("Error al obtener profiles:", profilesError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log("No se encontraron perfiles en la base de datos")
      return
    }

    const sampleUserId = profiles[0].id
    console.log(`Analizando datos para el usuario: ${sampleUserId}\n`)

    // Analizar tabla profiles
    console.log("📋 TABLA: profiles")
    console.log("Estructura:", Object.keys(profiles[0]))
    console.log("Datos de ejemplo:", profiles[0])
    console.log("\n" + "=".repeat(50) + "\n")

    // Analizar tabla personal_info
    const { data: personalInfo, error: personalInfoError } = await supabase
      .from("personal_info")
      .select("*")
      .eq("user_id", sampleUserId)

    console.log("📋 TABLA: personal_info")
    if (personalInfoError) {
      console.log("Error:", personalInfoError.message)
    } else if (!personalInfo || personalInfo.length === 0) {
      console.log("Sin datos en personal_info")
    } else {
      console.log("Estructura:", Object.keys(personalInfo[0]))
      console.log("Datos de ejemplo:", personalInfo[0])
    }
    console.log("\n" + "=".repeat(50) + "\n")

    // Analizar tabla education
    const { data: education, error: educationError } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", sampleUserId)

    console.log("📋 TABLA: education")
    if (educationError) {
      console.log("Error:", educationError.message)
    } else if (!education || education.length === 0) {
      console.log("Sin datos en education")
    } else {
      console.log("Estructura:", Object.keys(education[0]))
      console.log("Cantidad de registros:", education.length)
      console.log("Primer registro:", education[0])
    }
    console.log("\n" + "=".repeat(50) + "\n")

    // Analizar tabla experience
    const { data: experience, error: experienceError } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", sampleUserId)

    console.log("📋 TABLA: experience")
    if (experienceError) {
      console.log("Error:", experienceError.message)
    } else if (!experience || experience.length === 0) {
      console.log("Sin datos en experience")
    } else {
      console.log("Estructura:", Object.keys(experience[0]))
      console.log("Cantidad de registros:", experience.length)
      console.log("Primer registro:", experience[0])
    }
    console.log("\n" + "=".repeat(50) + "\n")

    // Analizar tabla languages
    const { data: languages, error: languagesError } = await supabase
      .from("languages")
      .select("*")
      .eq("user_id", sampleUserId)

    console.log("📋 TABLA: languages")
    if (languagesError) {
      console.log("Error:", languagesError.message)
    } else if (!languages || languages.length === 0) {
      console.log("Sin datos en languages")
    } else {
      console.log("Estructura:", Object.keys(languages[0]))
      console.log("Cantidad de registros:", languages.length)
      console.log("Primer registro:", languages[0])
    }
    console.log("\n" + "=".repeat(50) + "\n")

    // Mostrar todas las tablas disponibles
    console.log("🔍 ANÁLISIS DE TODAS LAS TABLAS RELACIONADAS CON PERFILES:")
    
    const tables = [
      "profiles", "personal_info", "education", "experience", "languages", 
      "skills", "references", "documents", "licenses", "certifications"
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(1)

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else if (data && data.length > 0) {
          console.log(`✅ ${table}: ${Object.keys(data[0]).join(", ")}`)
        } else {
          console.log(`⚠️  ${table}: Tabla vacía`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Error al acceder`)
      }
    }

  } catch (error) {
    console.error("Error general:", error)
  }
}

// Ejecutar el análisis
analyzeUserData()
  .then(() => {
    console.log("\n✅ Análisis completado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error:", error)
    process.exit(1)
  })
