"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        setLoading(true)

        // Usar getSession en lugar de getUser para reducir llamadas a la API
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session) {
          console.error("Error loading user session:", error)
          if (isMounted) {
            setLoading(false)
            router.push("/auth/login")
          }
          return
        }

        if (isMounted) {
          setUser(session.user)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in useUser hook:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Cargar usuario al montar el componente
    loadUser()

    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser(session?.user || null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [router, supabase])

  return { user, loading }
}
