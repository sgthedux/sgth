"use client"

import useSWR from "swr"
import { secureDB } from "@/lib/supabase/secure-client"
import { useUser } from "./use-user"

// Fetcher que usa el cliente seguro
const fetcher = async (url: string, userId: string) => {
  const [, endpoint] = url.split("/")

  switch (endpoint) {
    case "profile":
      return await secureDB.getProfile(userId)
    case "personal-info":
      return await secureDB.getPersonalInfo(userId)
    case "education":
      return await secureDB.getEducation(userId)
    case "experience":
      return await secureDB.getExperience(userId)
    case "languages":
      return await secureDB.getLanguages(userId)
    case "all-data":
      return await secureDB.getAllProfileData(userId)
    default:
      throw new Error(`Endpoint no reconocido: ${endpoint}`)
  }
}

// Hook principal que combina todos los datos
export function useProfile() {
  const { user } = useUser()

  const {
    data: profile,
    error: profileError,
    mutate: mutateProfile,
  } = useSWR(user?.id ? ["/profile", user.id] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  const {
    data: personalInfo,
    error: personalInfoError,
    mutate: mutatePersonalInfo,
  } = useSWR(user?.id ? ["/personal-info", user.id] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  const {
    data: education,
    error: educationError,
    mutate: mutateEducation,
  } = useSWR(user?.id ? ["/education", user.id] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  const {
    data: experience,
    error: experienceError,
    mutate: mutateExperience,
  } = useSWR(user?.id ? ["/experience", user.id] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  const {
    data: languages,
    error: languagesError,
    mutate: mutateLanguages,
  } = useSWR(user?.id ? ["/languages", user.id] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  // Función para revalidar todos los datos
  const mutateAll = () => {
    mutateProfile()
    mutatePersonalInfo()
    mutateEducation()
    mutateExperience()
    mutateLanguages()
  }

  return {
    profile,
    personalInfo,
    education: education || [],
    experience: experience || [],
    languages: languages || [],
    isLoading: !user?.id || (!profile && !profileError),
    error: profileError || personalInfoError || educationError || experienceError || languagesError,
    mutate: mutateAll,
    mutateProfile,
    mutatePersonalInfo,
    mutateEducation,
    mutateExperience,
    mutateLanguages,
  }
}

// Hook para cargar todos los datos de una vez (compatibilidad)
export function useAllProfileData(userId: string | undefined) {
  const {
    data: allData,
    error,
    mutate,
  } = useSWR(userId ? ["/all-data", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    data: allData,
    isLoading: !userId || (!allData && !error),
    isError: error,
    mutate,
  }
}

// Hook para obtener solo el perfil del usuario
export function useUserProfile(userId: string | undefined) {
  const {
    data: profile,
    error,
    mutate,
  } = useSWR(userId ? ["/profile", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    profile,
    isLoading: !userId || (!profile && !error),
    isError: error,
    mutate,
  }
}

// Hook para obtener información personal
export function usePersonalInfo(userId: string | undefined) {
  const {
    data: personalInfo,
    error,
    mutate,
  } = useSWR(userId ? ["/personal-info", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    personalInfo,
    isLoading: !userId || (!personalInfo && !error),
    isError: error,
    mutate,
  }
}

// Hook para obtener educación
export function useEducation(userId: string | undefined) {
  const {
    data: education,
    error,
    mutate,
  } = useSWR(userId ? ["/education", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    education: education || [],
    isLoading: !userId || (!education && !error),
    isError: error,
    mutate,
  }
}

// Hook para obtener experiencia
export function useExperience(userId: string | undefined) {
  const {
    data: experience,
    error,
    mutate,
  } = useSWR(userId ? ["/experience", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    experience: experience || [],
    isLoading: !userId || (!experience && !error),
    isError: error,
    mutate,
  }
}

// Hook para obtener idiomas
export function useLanguages(userId: string | undefined) {
  const {
    data: languages,
    error,
    mutate,
  } = useSWR(userId ? ["/languages", userId] : null, ([url, userId]) => fetcher(url, userId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  return {
    languages: languages || [],
    isLoading: !userId || (!languages && !error),
    isError: error,
    mutate,
  }
}
