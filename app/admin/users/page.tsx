"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Pencil, AlertCircle, Loader2, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteUserConfirmation } from "@/components/delete-user-confirmation"
import Link from "next/link"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState("")
  const [cvDocuments, setCvDocuments] = useState({})
  const [userStatus, setUserStatus] = useState({})
  const [savingStatus, setSavingStatus] = useState({})
  const [statusChanged, setStatusChanged] = useState({})

  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [usersPerPage] = useState(15)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)

  useEffect(() => {
    loadUsers(1)
  }, [])

  async function loadUsers(page = 1, loadAll = false) {
    if (page === 1) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    setError(null)
    setDebugInfo("")

    try {
      const supabase = createClient()
      setDebugInfo((prev) => prev + "Cliente Supabase creado.\n")

      // Obtener el total de usuarios para la paginación
      if (page === 1) {
        const { count, error: countError } = await supabase.from("profiles").select("*", { count: "exact", head: true })

        if (countError) {
          throw new Error(`Error al obtener el conteo de usuarios: ${countError.message}`)
        }

        setTotalUsers(count || 0)
        setDebugInfo((prev) => prev + `Total de usuarios: ${count}\n`)
        setHasMoreUsers(count > usersPerPage)
      }

      // Calcular el rango para la paginación
      const from = (page - 1) * usersPerPage
      const to = from + usersPerPage - 1

      // Consulta con paginación
      setDebugInfo((prev) => prev + `Obteniendo usuarios (página ${page})...\n`)

      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (!loadAll) {
        query = query.range(from, to)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Error al obtener usuarios: ${error.message}`)
      }

      setDebugInfo((prev) => prev + `Usuarios obtenidos: ${data?.length || 0}\n`)

      // Si es la primera página, reemplazar usuarios; de lo contrario, añadir
      if (page === 1) {
        setUsers(data || [])
      } else {
        setUsers((prev) => [...prev, ...(data || [])])
      }

      // Verificar si hay más usuarios para cargar
      setHasMoreUsers(data.length === usersPerPage)

      // Actualizar la página actual
      setCurrentPage(page)

      // Inicializar el estado de cada usuario
      const initialStatus = {}
      data.forEach((user) => {
        initialStatus[user.id] = user.status || "Pendiente"
      })
      setUserStatus((prev) => ({ ...prev, ...initialStatus }))

      // Obtener documentos CV firmados para cada usuario
      const cvDocs = {}
      for (const user of data || []) {
        const { data: docData } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "cv_signed")
          .order("created_at", { ascending: false })
          .limit(1)

        if (docData && docData.length > 0) {
          cvDocs[user.id] = docData[0]
        }
      }
      setCvDocuments((prev) => ({ ...prev, ...cvDocs }))

      // Si es la primera página, cargar la siguiente página en segundo plano
      if (page === 1 && data.length === usersPerPage) {
        setTimeout(() => {
          loadUsers(2, false)
        }, 1000)
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError(err.message || "Error desconocido al cargar usuarios")
      setDebugInfo((prev) => prev + `ERROR: ${err.message}\n`)
    } finally {
      if (page === 1) {
        setLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  const loadMoreUsers = () => {
    if (!isLoadingMore && hasMoreUsers) {
      loadUsers(currentPage + 1)
    }
  }

  // Función para obtener las iniciales del nombre
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Función para manejar el cambio de estado
  const handleStatusChange = (userId, newStatus) => {
    setUserStatus((prev) => ({
      ...prev,
      [userId]: newStatus,
    }))

    setStatusChanged((prev) => ({
      ...prev,
      [userId]: true,
    }))
  }

  // Función para guardar el cambio de estado
  const saveStatusChange = async (userId) => {
    try {
      setSavingStatus((prev) => ({
        ...prev,
        [userId]: true,
      }))

      const supabase = createClient()
      const { error } = await supabase.from("profiles").update({ status: userStatus[userId] }).eq("id", userId)

      if (error) {
        throw new Error(`Error al actualizar estado: ${error.message}`)
      }

      // Actualizar el usuario en la lista
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: userStatus[userId] } : user)))

      setStatusChanged((prev) => ({
        ...prev,
        [userId]: false,
      }))

      // Mostrar mensaje de éxito
      alert("Estado actualizado correctamente")
    } catch (err) {
      console.error("Error al guardar estado:", err)
      alert(`Error al guardar: ${err.message}`)
    } finally {
      setSavingStatus((prev) => ({
        ...prev,
        [userId]: false,
      }))
    }
  }

  // Componente para el selector de estado
  const StatusSelector = ({ userId, currentStatus }) => {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={userStatus[userId] || currentStatus}
          onValueChange={(value) => handleStatusChange(userId, value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Aceptado">Aceptado</SelectItem>
            <SelectItem value="Denegado">Denegado</SelectItem>
          </SelectContent>
        </Select>

        {statusChanged[userId] && (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
            onClick={() => saveStatusChange(userId)}
            disabled={savingStatus[userId]}
          >
            {savingStatus[userId] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="sr-only">Guardar cambios</span>
          </Button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="mb-2">Cargando usuarios...</p>
        <p className="text-sm text-muted-foreground">Obteniendo los primeros {usersPerPage} registros</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error al cargar usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-500 font-medium mb-2">{error}</p>
              <div className="w-full mt-4 p-4 bg-gray-100 rounded-md">
                <p className="font-medium mb-2">Información de depuración:</p>
                <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
              </div>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Intentar nuevamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de usuarios</h1>
        <p className="text-muted-foreground">Administra los usuarios del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <>
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
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{(currentPage - 1) * usersPerPage + index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "Usuario"} />
                            <AvatarFallback className="bg-primary/10">
                              {getInitials(user.full_name || "")}
                            </AvatarFallback>
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
                      <TableCell>
                        <StatusSelector userId={user.id} currentStatus={user.status || "Pendiente"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                            onClick={() => {
                              const doc = cvDocuments[user.id]
                              if (doc && doc.url) {
                                window.open(doc.url, "_blank")
                              } else {
                                alert("No se encontró la hoja de vida firmada para este usuario")
                              }
                            }}
                            title={
                              cvDocuments[user.id] ? "Descargar hoja de vida firmada" : "No hay hoja de vida firmada"
                            }
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Ver hoja de vida firmada</span>
                          </Button>
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            title="Editar usuario"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar usuario</span>
                          </Link>
                          <DeleteUserConfirmation
                            userId={user.id}
                            userName={user.full_name || user.email || "Usuario"}
                            onSuccess={() => {
                              // Actualizar la lista de usuarios después de eliminar
                              setUsers((prev) => prev.filter((u) => u.id !== user.id))
                              alert("Usuario eliminado correctamente")
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Controles de paginación */}
              <div className="flex justify-center mt-6">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Cargando más usuarios...</span>
                  </div>
                ) : hasMoreUsers ? (
                  <Button variant="outline" onClick={loadMoreUsers}>
                    Cargar más usuarios
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mostrando {users.length} de {totalUsers} usuarios
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
