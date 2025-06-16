"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

interface UseFormCacheOptions {
  formKey: string
  userId?: string
  autoSave?: boolean
  autoSaveDelay?: number
}

export function useFormCache<T extends Record<string, any>>(
  initialData: T,
  options: UseFormCacheOptions
) {
  const { formKey, userId, autoSave = true, autoSaveDelay = 2000 } = options
  const cacheKey = userId ? `form_${formKey}_${userId}` : `form_${formKey}`
  
  // Memorizar datos iniciales para evitar re-renders
  const memoizedInitialData = useMemo(() => initialData, [])
  const isInitialArray = useMemo(() => Array.isArray(memoizedInitialData), [memoizedInitialData])
  
  const [data, setData] = useState<T>(memoizedInitialData)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)  // Load cached data on mount (solo una vez)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsedData = JSON.parse(cached)
          console.log(`Loading cache for ${cacheKey}:`, parsedData)
          
          // Verificar si los datos son compatibles con el formato inicial
          if (isInitialArray && Array.isArray(parsedData)) {
            setData(parsedData as unknown as T)
          } else if (!isInitialArray && !Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
            // Verificar que las claves son strings válidas (no números)
            const hasNumericKeys = Object.keys(parsedData).some(key => !isNaN(Number(key)))
            if (hasNumericKeys) {
              console.warn(`Cache corrupto detectado para ${cacheKey}, usando datos iniciales`)
              localStorage.removeItem(cacheKey)
              setData(memoizedInitialData)
            } else {
              setData({ ...memoizedInitialData, ...parsedData })
            }
          } else {
            // Si hay incompatibilidad de tipos, usar datos iniciales
            console.warn(`Incompatibilidad de tipos en cache para ${cacheKey}, usando datos iniciales`)
            localStorage.removeItem(cacheKey)
            setData(memoizedInitialData)
          }
        }
      } catch (error) {
        console.warn('Error loading cached form data, using initial data:', error)
        localStorage.removeItem(cacheKey)
        setData(memoizedInitialData)
      } finally {
        setIsInitialized(true)
      }
    }
  }, [cacheKey, isInitialArray, memoizedInitialData, isInitialized])

  // Save to cache
  const saveToCache = useCallback((dataToSave: T) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(dataToSave))
        setLastSaved(new Date())
        setIsDirty(false)
      } catch (error) {
        console.warn('Error saving to cache:', error)
      }
    }
  }, [cacheKey])  // Auto-save with debounce (solo si está inicializado)
  useEffect(() => {
    if (!autoSave || !isDirty || !isInitialized) return

    const timer = setTimeout(() => {
      saveToCache(data)
      // Removemos la notificación automática para evitar spam
    }, autoSaveDelay)

    return () => clearTimeout(timer)
  }, [data, isDirty, autoSave, autoSaveDelay, saveToCache, isInitialized])// Update data function
  const updateData = useCallback((updates: Partial<T> | T) => {
    if (isInitialArray) {
      // Si es un array, reemplazar completamente
      setData(updates as T)
    } else {
      // Si es un objeto, hacer merge
      setData(prev => ({ ...prev, ...updates } as T))
    }
    setIsDirty(true)
  }, [isInitialArray]) // Usar isInitialArray que es estable  // Clear cache
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey)
      setData(memoizedInitialData)
      setIsDirty(false)
      setLastSaved(null)
      // Solo mostrar notificación si es una acción explícita del usuario
    }
  }, [cacheKey, memoizedInitialData])

  // Manual save
  const saveNow = useCallback(() => {
    setIsSaving(true)
    saveToCache(data)
    setIsSaving(false)
    toast.success('✅ Datos guardados en cache')
  }, [data, saveToCache])

  return {
    data,
    updateData,
    isDirty,
    isSaving,
    lastSaved,
    saveToCache,
    clearCache,
    saveNow,
    cacheKey
  }
}
