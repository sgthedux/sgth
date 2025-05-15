"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserStatus } from "@/app/admin/users/actions"
import { useToast } from "@/components/ui/use-toast"

interface UserStatusDialogProps {
  userId: string
  userName: string
  currentStatus: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdated?: () => void
}

export function UserStatusDialog({
  userId,
  userName,
  currentStatus,
  open,
  onOpenChange,
  onStatusUpdated,
}: UserStatusDialogProps) {
  const [status, setStatus] = useState(currentStatus || "Pendiente")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const result = await updateUserStatus(userId, status)

      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: `El estado de ${userName} ha sido actualizado a ${status}.`,
        })
        onStatusUpdated?.()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el estado del usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado del usuario.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Estado</DialogTitle>
          <DialogDescription>
            Actualiza el estado de {userName}. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Estado
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
