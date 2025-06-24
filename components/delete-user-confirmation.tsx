"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface DeleteUserConfirmationProps {
  userId: string
  userName: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function DeleteUserConfirmation({ userId, userName, onSuccess, onError }: DeleteUserConfirmationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "eliminar") {
      setError("Debe escribir 'eliminar' para confirmar")
      return
    }

    try {
      setIsDeleting(true)
      setError(null)

      const supabase = createClient()

      // 1. Obtener todos los documentos del usuario
      const { data: documents, error: docsError } = await supabase.from("documents").select("*").eq("user_id", userId)

      if (docsError) {
        throw new Error(`Error al obtener documentos: ${docsError.message}`)
      }

      // 2. Eliminar documentos de Cloudflare R2 (si es necesario)
      for (const doc of documents || []) {
        if (doc.storage_path) {
          try {
            // Eliminar de R2 usando la API de delete-file
            await fetch(`/api/delete-file`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ path: doc.storage_path }),
            })
          } catch (fileError) {
            console.error(`Error al eliminar archivo ${doc.storage_path}:`, fileError)
            // Continuamos con el proceso aunque falle la eliminación de algún archivo
          }
        }
      }

      // 3. Eliminar documentos de Supabase
      if (documents && documents.length > 0) {
        const { error: deleteDocsError } = await supabase.from("documents").delete().eq("user_id", userId)

        if (deleteDocsError) {
          throw new Error(`Error al eliminar documentos: ${deleteDocsError.message}`)
        }
      }

      // 4. Eliminar experiencia laboral
      const { error: expError } = await supabase.from("experience").delete().eq("user_id", userId)

      if (expError) {
        console.error(`Error al eliminar experiencia: ${expError.message}`)
        // Continuamos aunque falle
      }

      // 5. Eliminar educación
      const { error: eduError } = await supabase.from("education").delete().eq("user_id", userId)

      if (eduError) {
        console.error(`Error al eliminar educación: ${eduError.message}`)
        // Continuamos aunque falle
      }

      // 6. Eliminar idiomas
      const { error: langError } = await supabase.from("languages").delete().eq("user_id", userId)

      if (langError) {
        console.error(`Error al eliminar idiomas: ${langError.message}`)
        // Continuamos aunque falle
      }

      // 7. Eliminar perfil
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

      if (profileError) {
        throw new Error(`Error al eliminar perfil: ${profileError.message}`)
      }

      // 8. Eliminar usuario de autenticación (esto debe hacerse desde una función del servidor)
      const response = await fetch("/api/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar usuario de autenticación")
      }

      // Cerrar el diálogo y llamar al callback de éxito
      setIsOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error al eliminar usuario:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")

      if (onError && err instanceof Error) {
        onError(err)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
          title="Eliminar usuario"
          onClick={() => setIsOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar usuario</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar usuario permanentemente
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-3 py-2">
          <div className="text-sm text-muted-foreground">
            Esta acción eliminará <strong>permanentemente</strong> al usuario <strong>{userName}</strong> y todos
            sus datos:
          </div>
          
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Información personal y de perfil</li>
            <li>Documentos subidos (incluyendo CV)</li>
            <li>Historial de educación</li>
            <li>Experiencia laboral</li>
            <li>Idiomas y otras habilidades</li>
          </ul>
          
          <div className="font-medium text-sm text-muted-foreground">Esta acción no se puede deshacer.</div>
          
          <div className="pt-2">
            <label htmlFor="confirm" className="block text-sm font-medium mb-1 text-muted-foreground">
              Escriba &quot;eliminar&quot; para confirmar:
            </label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
              placeholder="eliminar"
            />
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== "eliminar"}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </div>
            ) : (
              "Eliminar permanentemente"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
