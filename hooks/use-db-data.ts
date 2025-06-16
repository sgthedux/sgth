"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface UseDBDataOptions {
  userId?: string
  table: string
  enabled?: boolean
}

export function useDBData<T>(options: UseDBDataOptions) {
  const { userId, table, enabled = true } = options
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: result, error: dbError } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (dbError) {
          throw new Error(dbError.message)
        }        setData(result || [])
        
        // Solo mostrar notificación si hay datos y es la primera carga explícita
        // Removemos las notificaciones automáticas para evitar spam      } catch (error) {
        console.error(`Error loading ${table}:`, error)
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : 'Error al cargar datos'
        setError(errorMessage)
        // Solo registrar en consola, no mostrar toast automático
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, table, enabled])

  return { data, loading, error, refetch: () => setLoading(true) }
}
