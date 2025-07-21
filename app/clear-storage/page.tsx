"use client"

import { useEffect } from "react"

export default function ClearStoragePage() {
  useEffect(() => {
    // Limpiar todos los documentos pendientes
    localStorage.removeItem('pending_documents')
    
    // Limpiar otros caches relacionados
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('pending') || key.includes('temp'))) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log("LocalStorage limpiado:", keysToRemove.length, "items eliminados")
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">LocalStorage Limpiado</h1>
      <p>Se han eliminado todos los documentos pendientes del localStorage.</p>
      <p>Ahora puedes volver a los formularios y los documentos no deberían aparecer en items nuevos.</p>
    </div>
  )
}
