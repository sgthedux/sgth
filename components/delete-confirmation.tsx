"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"

interface DeleteConfirmationProps {
  onDelete?: () => Promise<void> | void
  itemName: string
  buttonSize?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
  // Nuevos props para manejar la eliminación directamente
  tableName?: string
  itemId?: string
  userId?: string
  documentKey?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function DeleteConfirmation({
  onDelete,
  itemName,
  buttonSize = "sm",
  variant = "ghost",
  disabled = false,
  tableName,
  itemId,
  userId,
  documentKey,
  onSuccess,
  onError,
}: DeleteConfirmationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      console.log(`Eliminando ${itemName}...`)

      // 1. Eliminar de la base de datos (si se proporciona tableName e itemId)
      if (tableName && itemId) {
        console.log(`Eliminando de la tabla ${tableName} el registro con ID ${itemId}`)
        const { error } = await supabase.from(tableName).delete().eq("id", itemId)

        if (error) {
          console.error(`Error al eliminar de la base de datos:`, error)
        } else {
          console.log(`Registro eliminado correctamente de la base de datos`)
        }
      }

      // 2. Ejecutar la función onDelete personalizada (si se proporciona)
      if (onDelete) {
        await onDelete()
      }

      // 3. Llamar al callback de éxito (si se proporciona)
      if (onSuccess) {
        onSuccess()
      }

      setIsOpen(false)
    } catch (error) {
      console.error(`Error al eliminar:`, error)

      if (onError && error instanceof Error) {
        onError(error)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size={buttonSize}
          title={`Eliminar ${itemName}`}
          aria-label={`Eliminar ${itemName}`}
          disabled={disabled || isDeleting}
          onClick={() => setIsOpen(true)}
          className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {isDeleting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de eliminar este {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción eliminará permanentemente el {itemName}.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                Eliminando...
              </div>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
