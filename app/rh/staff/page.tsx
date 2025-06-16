"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserCheck, UserX, Mail, Phone, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StaffPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          personal_info (*)
        `)
        .order("full_name", { ascending: true })

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Error in fetchUsers:", error)
    } finally {
      setLoading(false)
    }
  }

  function getInitials(name) {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  function getStatusBadge(status) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Pendiente
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.personal_info?.document_number?.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar personal..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchUsers}>Actualizar</Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="inactive">Inactivos</TabsTrigger>
        </TabsList>

        {["all", "active", "inactive"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : filteredUsers.filter((user) => tabValue === "all" || user.status === tabValue).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground">
                    No hay personal {tabValue !== "all" ? `con estado "${tabValue}"` : ""} para mostrar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers
                  .filter((user) => tabValue === "all" || user.status === tabValue)
                  .map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage
                                src={user.avatar_url || "/placeholder-user.jpg"}
                                alt={user.full_name || "Usuario"}
                              />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{user.full_name || "Usuario sin nombre"}</CardTitle>
                              <CardDescription className="text-xs">{user.email || "Sin email"}</CardDescription>
                            </div>
                          </div>
                          <div>{getStatusBadge(user.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email || "No disponible"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user.personal_info?.phone || "No disponible"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {user.created_at
                                ? `Registrado: ${format(new Date(user.created_at), "PPP", { locale: es })}`
                                : "Fecha no disponible"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="font-normal">
                              {user.role || "user"}
                            </Badge>
                            {user.personal_info?.document_number && (
                              <Badge variant="outline" className="font-normal">
                                {user.personal_info.document_number}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" className="w-full">
                              Ver perfil
                            </Button>
                            {user.status === "active" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-amber-500 border-amber-500 hover:bg-amber-500/10"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Desactivar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-green-500 border-green-500 hover:bg-green-500/10"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
