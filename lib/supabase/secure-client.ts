import { createClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
}

// Cliente regular para autenticación
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Cliente administrativo solo si la service key está disponible
let supabaseAdmin: any = null

if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
} else {
  console.warn("SUPABASE_SERVICE_ROLE_KEY no está disponible. Usando cliente regular.")
}

// Función para verificar permisos de usuario
async function checkUserPermissions(userId: string, targetUserId?: string) {
  try {
    if (!userId) {
      console.error("userId es requerido para verificar permisos")
      return { isAdmin: false, canAccess: false }
    }

    // Si no hay cliente admin, usar el cliente regular
    const client = supabaseAdmin || supabaseClient

    // Obtener el perfil del usuario actual con manejo de errores mejorado
    const { data: userProfile, error } = await client.from("profiles").select("role").eq("id", userId).maybeSingle() // Usar maybeSingle en lugar de single para evitar errores si no existe

    if (error) {
      console.error("Error verificando permisos:", error)
      // Si el perfil no existe, asumir usuario regular
      return { isAdmin: false, canAccess: userId === (targetUserId || userId) }
    }

    // Si no hay perfil, crear uno básico y asumir usuario regular
    if (!userProfile) {
      console.warn(`Perfil no encontrado para usuario ${userId}, asumiendo usuario regular`)
      return { isAdmin: false, canAccess: userId === (targetUserId || userId) }
    }

    const isAdmin = userProfile?.role === "admin"
    const canAccess = isAdmin || !targetUserId || userId === targetUserId

    return { isAdmin, canAccess }
  } catch (error) {
    console.error("Error en checkUserPermissions:", error)
    // En caso de error, permitir acceso solo a datos propios
    return { isAdmin: false, canAccess: userId === (targetUserId || userId) }
  }
}

// Funciones seguras para operaciones de base de datos
export const secureDB = {
  // Obtener perfil
  async getProfile(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a este perfil")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle()

      if (error) {
        console.error("Error obteniendo perfil:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error en getProfile:", error)
      throw error
    }
  },

  // Obtener información personal
  async getPersonalInfo(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client.from("personal_info").select("*").eq("user_id", userId).maybeSingle()

      if (error) {
        console.error("Error obteniendo información personal:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error en getPersonalInfo:", error)
      throw error
    }
  },

  // Obtener educación
  async getEducation(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client
        .from("education")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("Error obteniendo educación:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error en getEducation:", error)
      throw error
    }
  },

  // Obtener experiencia
  async getExperience(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client
        .from("experience")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("Error obteniendo experiencia:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error en getExperience:", error)
      throw error
    }
  },

  // Obtener idiomas
  async getLanguages(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client.from("languages").select("*").eq("user_id", userId)

      if (error) {
        console.error("Error obteniendo idiomas:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error en getLanguages:", error)
      throw error
    }
  },

  // Obtener todos los datos de una vez
  async getAllProfileData(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId

      if (!userId) {
        throw new Error("ID de usuario requerido")
      }

      const { canAccess } = await checkUserPermissions(currentUserId, userId)

      if (!canAccess) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient

      // Ejecutar consultas de forma secuencial para mejor manejo de errores
      let profile = null
      let personalInfo = null
      let education = []
      let experience = []
      let languages = []

      try {
        const { data: profileData, error: profileError } = await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle()

        if (profileError) {
          console.error("Error obteniendo perfil:", profileError)
        } else {
          profile = profileData
        }
      } catch (error) {
        console.error("Error en consulta de perfil:", error)
      }

      try {
        const { data: personalData, error: personalError } = await client
          .from("personal_info")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        if (personalError) {
          console.error("Error obteniendo información personal:", personalError)
        } else {
          personalInfo = personalData
        }
      } catch (error) {
        console.error("Error en consulta de información personal:", error)
      }

      try {
        const { data: educationData, error: educationError } = await client
          .from("education")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })

        if (educationError) {
          console.error("Error obteniendo educación:", educationError)
        } else {
          education = educationData || []
        }
      } catch (error) {
        console.error("Error en consulta de educación:", error)
      }

      try {
        const { data: experienceData, error: experienceError } = await client
          .from("experience")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })

        if (experienceError) {
          console.error("Error obteniendo experiencia:", experienceError)
        } else {
          experience = experienceData || []
        }
      } catch (error) {
        console.error("Error en consulta de experiencia:", error)
      }

      try {
        const { data: languagesData, error: languagesError } = await client
          .from("languages")
          .select("*")
          .eq("user_id", userId)

        if (languagesError) {
          console.error("Error obteniendo idiomas:", languagesError)
        } else {
          languages = languagesData || []
        }
      } catch (error) {
        console.error("Error en consulta de idiomas:", error)
      }

      return {
        profile,
        personalInfo,
        education,
        experience,
        languages,
      }
    } catch (error) {
      console.error("Error en getAllProfileData:", error)
      throw error
    }
  },

  // Insertar/actualizar información personal
  async upsertPersonalInfo(currentUserId: string, data: any) {
    try {
      const { canAccess } = await checkUserPermissions(currentUserId, data.user_id)

      if (!canAccess) {
        throw new Error("No tienes permisos para modificar esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data: result, error } = await client
        .from("personal_info")
        .upsert({ ...data, updated_at: new Date().toISOString() })
        .select()
        .single()

      if (error) throw error
      return result
    } catch (error) {
      console.error("Error en upsertPersonalInfo:", error)
      throw error
    }
  },

  // Obtener todos los usuarios (solo para admins)
  async getAllUsers(currentUserId: string) {
    try {
      const { isAdmin } = await checkUserPermissions(currentUserId)

      if (!isAdmin) {
        throw new Error("No tienes permisos para acceder a esta información")
      }

      const client = supabaseAdmin || supabaseClient
      const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error en getAllUsers:", error)
      throw error
    }
  },
}

// Exportar también el cliente regular para autenticación
export { supabaseClient }
