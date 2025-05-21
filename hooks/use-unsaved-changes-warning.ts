"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  const router = useRouter()

  useEffect(() => {
    // Función para mostrar una advertencia cuando el usuario intenta salir de la página
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Mensaje estándar para navegadores modernos
        const message = "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    // Agregar el evento al window
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Limpiar el evento cuando el componente se desmonte
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  return null
}
