import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

// Caché en memoria para reducir solicitudes
const memoryCache = new Map()

// Fetcher optimizado para Supabase con manejo de errores mejorado
const fetcher = async (key: string) => {
  // Verificar caché en memoria primero (más rápido que SWR)
  if (memoryCache.has(key)) {
    return memoryCache.get(key)
  }

  const [path, userId] = key.split("/")
  const supabase = createClient()

  try {
    let data

    // Optimizar consultas seleccionando solo campos necesarios
    if (path === "profile") {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", userId)
        .single()

      if (error) throw error
      data = profileData
    } else if (path === "personal_info") {
      const { data: personalData, error } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (error) throw error
      data = personalData
    } else if (path === "education") {
      const { data: educationData, error } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) throw error
      data = educationData
    } else if (path === "experience") {
      const { data: experienceData, error } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) throw error
      data = experienceData
    } else if (path === "languages") {
      const { data: languagesData, error } = await supabase.from("languages").select("*").eq("user_id", userId)

      if (error) throw error
      data = languagesData
    } else if (path === "all") {
      // Consulta optimizada para cargar todos los datos en una sola solicitud
      const [profileRes, personalRes, educationRes, experienceRes, languagesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", userId).single(),
        supabase.from("personal_info").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("education").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
        supabase.from("experience").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
        supabase.from("languages").select("*").eq("user_id", userId),
      ])

      // Verificar errores
      if (profileRes.error) throw profileRes.error
      if (personalRes.error) throw personalRes.error
      if (educationRes.error) throw educationRes.error
      if (experienceRes.error) throw experienceRes.error
      if (languagesRes.error) throw languagesRes.error

      // Guardar cada resultado en la caché de memoria
      memoryCache.set(`profile/${userId}`, profileRes.data)
      memoryCache.set(`personal_info/${userId}`, personalRes.data)
      memoryCache.set(`education/${userId}`, educationRes.data)
      memoryCache.set(`experience/${userId}`, experienceRes.data)
      memoryCache.set(`languages/${userId}`, languagesRes.data)

      data = {
        profile: profileRes.data,
        personalInfo: personalRes.data,
        education: educationRes.data,
        experience: experienceRes.data,
        languages: languagesRes.data,
      }
    }

    // Guardar en caché de memoria
    memoryCache.set(key, data)
    return data
  } catch (error) {
    // Manejar error "Too Many Requests"
    if (error instanceof Error && error.message.includes("Too Many R")) {
      console.warn("Rate limit detected, using cached data if available")

      // Intentar obtener datos del localStorage como fallback
      try {
        const cachedData = localStorage.getItem(key)
        if (cachedData) {
          const parsedData = JSON.parse(cachedData)
          return parsedData
        }
      } catch (e) {
        console.error("Error retrieving from localStorage:", e)
      }

      // Si no hay caché, devolver un objeto vacío en lugar de lanzar error
      return path === "profile" ? {} : []
    }

    throw error
  }
}

// Hook para cargar todos los datos de una vez
export function useAllProfileData(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `all/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      // Guardar en localStorage para persistencia
      try {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`${key}/${userId}`, JSON.stringify(value))
        })
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

// Hook para obtener el perfil del usuario
export function useProfile(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `profile/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      try {
        localStorage.setItem(`profile/${userId}`, JSON.stringify(data))
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    profile: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

// Hook para obtener información personal
export function usePersonalInfo(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `personal_info/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      try {
        localStorage.setItem(`personal_info/${userId}`, JSON.stringify(data))
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    personalInfo: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

// Hook para obtener educación
export function useEducation(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `education/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      try {
        localStorage.setItem(`education/${userId}`, JSON.stringify(data))
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    education: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

// Hook para obtener experiencia
export function useExperience(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `experience/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      try {
        localStorage.setItem(`experience/${userId}`, JSON.stringify(data))
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    experience: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

// Hook para obtener idiomas
export function useLanguages(userId: string | undefined) {
  const { data, error, mutate } = useSWR(userId ? `languages/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    errorRetryCount: 3,
    onSuccess: (data) => {
      try {
        localStorage.setItem(`languages/${userId}`, JSON.stringify(data))
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    },
  })

  return {
    languages: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
