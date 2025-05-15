"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Pencil, Settings, Trash2, User, Search, CheckCircle, XCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { UserStatusDialog } from "@/components/user-status-dialog"
import { DeleteUserDialog } from "@/components/delete-user-dialog"
import { useRouter } from "next/navigation"

interface AdminUsersClientProps {
  initialUsers: any[]
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const router = useRouter()

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.document_number && user.document_number.toLowerCase().includes(searchLower))
    )
  })

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleStatusChange = (user: any) => {
    setSelectedUser(user)
    setIsStatusDialogOpen(true)
  }

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleViewCV = (userId: string) => {
    // Aquí puedes implementar la lógica para ver la hoja de vida
    console.log("Ver hoja de vida del usuario:", userId)
  }

  const handleUserUpdated = () => {
    router.refresh()
  }

  const handleUserDeleted = () => {
    setUsers(users.filter((user) => user.id !== selectedUser.id))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprobado":
      case "Aceptado":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" /> Aceptado
          </Badge>
        )
      case "Rechazado":
      case "Denegado":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Denegado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            <Clock className="h-3 w-3 mr-1" /> Pendiente
          </Badge>
        )
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)] border rounded-lg">
        {filteredUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Opciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "Usuario"} />
                        <AvatarFallback className="bg-primary/10">{getInitials(user.full_name || "")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold uppercase">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.document_type || "Cédula"} - {user.document_number || "Sin documento"}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status || "Pendiente")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                        onClick={() => handleViewCV(user.id)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Ver hoja de vida</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar usuario</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border-amber-200"
                        onClick={() => handleStatusChange(user)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Configurar estado</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar usuario</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? "No se encontraron usuarios con esa búsqueda" : "No hay usuarios registrados"}
            </p>
          </div>
        )}
      </ScrollArea>

      {selectedUser && (
        <>
          <UserProfileDialog
            user={selectedUser}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleUserUpdated}
          />

          <UserStatusDialog
            user={selectedUser}
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            onSave={handleUserUpdated}
          />

          <DeleteUserDialog
            user={selectedUser}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDelete={handleUserDeleted}
          />
        </>
      )}
    </>
  )
}
