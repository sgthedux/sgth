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
import { updateUserRole } from "@/app/admin/users/actions"
import { useToast } from "@/components/ui/use-toast"

interface UserProfileDialogProps {
  userId: string
  userName: string
  currentRole: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated?: () => void
}

export function UserProfileDialog({
  userId,
  userName,
  currentRole,
  open,
  onOpenChange,
  onRoleUpdated,
}: UserProfileDialogProps) {
  const [role, setRole] = useState(currentRole || "user")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const result = await updateUserRole(userId, role)

      if (result.success) {
        toast({
          title: "Rol actualizado",
          description: `El rol de ${userName} ha sido actualizado a ${role}.`,
        })
        onRoleUpdated?.()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el rol del usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el rol del usuario.",
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
          <DialogTitle>Actualizar Rol</DialogTitle>
          <DialogDescription>
            Actualiza el rol de {userName}. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Rol
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
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
