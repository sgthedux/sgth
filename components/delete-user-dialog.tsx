"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeleteUserDialogProps {
  user: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
}

export function DeleteUserDialog({ user, open, onOpenChange, onDelete }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Primero eliminamos los registros relacionados
      // Experiencia
      await supabase.from("experience").delete().eq("user_id", user.id)

      // Educación
      await supabase.from("education").delete().eq("user_id", user.id)

      // Idiomas
      await supabase.from("languages").delete().eq("user_id", user.id)

      // Documentos
      const { data: documents } = await supabase.from("documents").select("*").eq("user_id", user.id)

      // Eliminar archivos de documentos de storage
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          if (doc.file_path) {
            await supabase.storage.from("documents").remove([doc.file_path])
          }
        }

        // Eliminar registros de documentos
        await supabase.from("documents").delete().eq("user_id", user.id)
      }

      // Eliminar avatar si existe
      if (user.avatar_url) {
        const avatarPath = user.avatar_url.split("/").pop()
        if (avatarPath) {
          await supabase.storage.from("images").remove([`avatars/${user.id}/${avatarPath}`])
        }
      }

      // Finalmente eliminamos el perfil
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)

      if (profileError) throw profileError

      // Eliminar usuario de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        console.error("Error al eliminar usuario de auth:", authError)
        // Continuamos aunque falle la eliminación de auth
      }

      onDelete()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error)
      setError(error.message || "Error al eliminar el usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de eliminar este usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este usuario, incluyendo su
            perfil, documentos, experiencia, educación e idiomas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar usuario"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
