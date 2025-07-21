"use client"

import { useRef, useCallback } from 'react'
import { usePendingDocuments } from './use-pending-documents'

export interface DocumentRef {
  getPendingTempId: () => string | null
  getDocumentUrl: () => string | null
}

export function useDocumentRefs() {
  const { associatePendingDocument } = usePendingDocuments()
  const documentRefs = useRef<Map<string, DocumentRef>>(new Map())

  const addDocumentRef = useCallback((itemId: string, ref: DocumentRef) => {
    documentRefs.current.set(itemId, ref)
  }, [])

  const removeDocumentRef = useCallback((itemId: string) => {
    documentRefs.current.delete(itemId)
  }, [])

  const associateDocumentsWithRecord = useCallback(async (
    itemId: string,
    recordId: string,
    formType: 'education' | 'experience' | 'language',
    documentType: string
  ) => {
    const ref = documentRefs.current.get(itemId)
    if (!ref) return

    try {
      const tempId = ref.getPendingTempId()
      if (tempId) {
        console.log(`Associating pending document ${tempId} with record ${recordId}`)
        await associatePendingDocument(tempId, recordId, formType, documentType)
      }
    } catch (error) {
      console.error('Error associating document:', error)
    }
  }, [associatePendingDocument])

  const associateAllDocumentsWithRecords = useCallback(async (
    savedItems: Array<{ id: string; tempId?: string; education_type?: string }>,
    formType: 'education' | 'experience' | 'language'
  ) => {
    const promises = savedItems.map(async (item) => {
      if (item.tempId) {
        // Determinar el tipo de documento basado en el tipo de educación
        let documentType = 'certificate'
        if (formType === 'education') {
          documentType = item.education_type === 'basic' ? 'basic_education_certificate' : 'higher_education_diploma'
        } else if (formType === 'experience') {
          documentType = 'experience_certificate'
        } else if (formType === 'language') {
          documentType = 'language_certificate'
        }
        
        await associateDocumentsWithRecord(item.tempId, item.id, formType, documentType)
      }
    })
    
    await Promise.all(promises)
  }, [associateDocumentsWithRecord])

  const getDocumentUrl = useCallback((itemId: string) => {
    const ref = documentRefs.current.get(itemId)
    return ref?.getDocumentUrl() || null
  }, [])

  const getAllDocumentUrls = useCallback(() => {
    const urls: Record<string, string> = {}
    documentRefs.current.forEach((ref, itemId) => {
      const url = ref.getDocumentUrl()
      if (url) {
        urls[itemId] = url
      }
    })
    return urls
  }, [])

  return {
    addDocumentRef,
    removeDocumentRef,
    associateDocumentsWithRecord,
    associateAllDocumentsWithRecords,
    getDocumentUrl,
    getAllDocumentUrls
  }
}
