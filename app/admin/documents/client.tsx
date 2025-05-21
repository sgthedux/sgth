"use client"

import { useState } from "react"
import { DocumentList } from "@/components/profile/document-list"
import { Button } from "@/components/ui/button"
import { ChevronLeft, User, FileText } from "lucide-react"

type DocumentInfo = {
  id: string
  name: string
  type: string
  url: string
  status: string
  created_at: string
}

type UserDocumentsProps = {
  documentsByUser: Record<string, { userName: string; documents: DocumentInfo[] }>
}

export function UserDocumentsClient({ documentsByUser }: UserDocumentsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Obtener el usuario seleccionado y sus documentos
  const selectedUser = selectedUserId ? documentsByUser[selectedUserId] : null

  // Volver a la lista de usuarios
  const handleBack = () => {
    setSelectedUserId(null)
  }

  // Si no hay usuarios con documentos
  if (Object.keys(documentsByUser).length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No hay documentos disponibles</p>
      </div>
    )
  }

  // Si hay un usuario seleccionado, mostrar sus documentos
  if (selectedUserId && selectedUser) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a la lista de usuarios
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">{selectedUser.userName}</h2>
          <span className="text-muted-foreground">({selectedUser.documents.length} documentos)</span>
        </div>

        <DocumentList userId={selectedUserId} documents={selectedUser.documents} isAdmin={true} />
      </div>
    )
  }

  // Mostrar la lista de usuarios
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(documentsByUser).map(([userId, { userName, documents }]) => (
        <div
          key={userId}
          className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
          onClick={() => setSelectedUserId(userId)}
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{userName}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{documents.length} documentos</span>
          </div>
        </div>
      ))}
    </div>
  )
}
