"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseSupabaseQueryOptions {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  errorMessage?: string
}

export function useSupabaseQuery(
  key: string,
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<any>,
  dependencies: any[] = [],
  options: UseSupabaseQueryOptions = {},
) {
  const { enabled = true, refetchInterval, onSuccess, onError, errorMessage = "Error al cargar datos" } = options

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const fetchData = async () => {
      if (!enabled) return

      setIsLoading(true)
      try {
        const result = await queryFn(supabase)

        if (isMounted) {
          // Handle different response formats
          if (result.data !== undefined) {
            setData(result.data)
            if (onSuccess) onSuccess(result.data)
          } else {
            setData(result)
            if (onSuccess) onSuccess(result)
          }

          setError(null)
        }
      } catch (err: any) {
        console.error(`Error in query ${key}:`, err)
        if (isMounted) {
          setError(err.message || errorMessage)
          if (onError) onError(err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    if (refetchInterval) {
      intervalId = setInterval(fetchData, refetchInterval)
    }

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, refetchInterval, ...dependencies])

  const refetch = async () => {
    setIsLoading(true)
    try {
      const result = await queryFn(supabase)

      // Handle different response formats
      if (result.data !== undefined) {
        setData(result.data)
        if (onSuccess) onSuccess(result.data)
      } else {
        setData(result)
        if (onSuccess) onSuccess(result)
      }

      setError(null)
    } catch (err: any) {
      console.error(`Error in query ${key}:`, err)
      setError(err.message || errorMessage)
      if (onError) onError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch }
}
