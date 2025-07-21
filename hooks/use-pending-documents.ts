// Hook para manejar documentos pendientes de asociar
import { useCallback, useEffect, useState } from 'react'

interface PendingDocument {
  tempId: string
  userId: string
  documentType: string
  formType: string
  name: string
  url: string
  timestamp: number
  tempItemId?: string
}

const PENDING_DOCS_KEY = 'pending_documents'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export function usePendingDocuments() {
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([])

  // Cargar documentos pendientes del localStorage
  useEffect(() => {
    const loadPendingDocs = () => {
      try {
        const stored = localStorage.getItem(PENDING_DOCS_KEY)
        if (stored) {
          const docs: PendingDocument[] = JSON.parse(stored)
          // Filtrar documentos que no hayan expirado
          const validDocs = docs.filter(doc => 
            Date.now() - doc.timestamp < CACHE_DURATION
          )
          setPendingDocs(validDocs)
          
          // Limpiar documentos expirados
          if (validDocs.length !== docs.length) {
            localStorage.setItem(PENDING_DOCS_KEY, JSON.stringify(validDocs))
          }
        }
      } catch (error) {
        console.error('Error loading pending documents:', error)
      }
    }

    loadPendingDocs()
  }, [])

  // Guardar documento pendiente
  const savePendingDocument = useCallback((doc: Omit<PendingDocument, 'tempId' | 'timestamp'>) => {
    const pendingDoc: PendingDocument = {
      ...doc,
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    setPendingDocs(prev => {
      const updated = [...prev, pendingDoc]
      localStorage.setItem(PENDING_DOCS_KEY, JSON.stringify(updated))
      return updated
    })

    console.log('Documento guardado en caché:', pendingDoc)
    return pendingDoc.tempId
  }, [])

  // Obtener documentos pendientes por tipo de formulario
  const getPendingDocumentsByForm = useCallback((formType: string, documentType: string) => {
    return pendingDocs.filter(doc => 
      doc.formType === formType && doc.documentType === documentType
    )
  }, [pendingDocs])

  // Asociar documento pendiente con recordId real
  const associatePendingDocument = useCallback(async (
    tempId: string, 
    realRecordId: string, 
    formType: string, 
    documentType: string
  ) => {
    try {
      const pendingDoc = pendingDocs.find(doc => doc.tempId === tempId)
      if (!pendingDoc) {
        console.error('Documento pendiente no encontrado:', tempId)
        return false
      }

      // Generar itemId real
      let realItemId: string
      if (formType === "education") {
        if (documentType === "basic_education_certificate") {
          realItemId = `basic_${realRecordId}`
        } else if (documentType === "higher_education_diploma") {
          realItemId = `higher_${realRecordId}`
        } else {
          realItemId = `${formType}_${realRecordId}`
        }
      } else {
        realItemId = `${formType}_${realRecordId}`
      }

      // Actualizar el documento en la base de datos
      const response = await fetch('/api/documents/associate-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempId,
          realItemId,
          realRecordId,
          userId: pendingDoc.userId,
          documentType: pendingDoc.documentType,
          formType: pendingDoc.formType,
          name: pendingDoc.name,
          url: pendingDoc.url
        })
      })

      if (response.ok) {
        // Remover documento de pendientes
        setPendingDocs(prev => {
          const updated = prev.filter(doc => doc.tempId !== tempId)
          localStorage.setItem(PENDING_DOCS_KEY, JSON.stringify(updated))
          return updated
        })

        console.log('Documento asociado correctamente:', realItemId)
        return true
      } else {
        console.error('Error al asociar documento:', await response.text())
        return false
      }
    } catch (error) {
      console.error('Error asociando documento pendiente:', error)
      return false
    }
  }, [pendingDocs])

  // Limpiar documentos pendientes
  const clearPendingDocuments = useCallback(() => {
    setPendingDocs([])
    localStorage.removeItem(PENDING_DOCS_KEY)
  }, [])

  // Remover documento específico
  const removePendingDocument = useCallback((tempId: string) => {
    setPendingDocs(prev => {
      const updated = prev.filter(doc => doc.tempId !== tempId)
      localStorage.setItem(PENDING_DOCS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Remover documento por tempItemId específico
  const removePendingDocumentByItemId = useCallback((tempItemId: string) => {
    setPendingDocs(prev => {
      const updated = prev.filter(doc => doc.tempItemId !== tempItemId)
      localStorage.setItem(PENDING_DOCS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return {
    pendingDocs,
    savePendingDocument,
    getPendingDocumentsByForm,
    associatePendingDocument,
    clearPendingDocuments,
    removePendingDocument,
    removePendingDocumentByItemId
  }
}
