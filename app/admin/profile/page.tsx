"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle, Shield, User, Mail, Calendar, Upload, Briefcase } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function AdminProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [personalInfo, setPersonalInfo] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Campos editables
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        // Verificar si el usuario es administrador
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) throw profileError

        if (!profileData || profileData.role !== "admin") {
          console.log("Usuario no es administrador, redirigiendo...")
          router.push("/dashboard")
          return
        }

        // Cargar información personal si existe
        const { data: personalData, error: personalError } = await supabase
          .from("personal_info")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (personalError && !personalError.message.includes("No rows found")) {
          throw personalError
        }

        setProfile(profileData)
        setPersonalInfo(personalData || {})
        setAvatarUrl(profileData.avatar_url)

        // Inicializar campos editables
        setFullName(profileData.full_name || "")
        setEmail(profileData.email || "")
        setPhone(personalData?.phone || "")
        setPosition(profileData.position || "Administrador del Sistema")
        setDepartment(profileData.department || "Tecnología")
        setBio(profileData.bio || "")

        setLoading(false)
      } catch (error: any) {
        console.error("Error al cargar el perfil:", error.message)
        toast({
          variant: "destructive",
          title: "Error al cargar el perfil",
          description: error.message,
        })
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debe seleccionar una imagen")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${profile.id}-${Math.random()}.${fileExt}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Actualizar perfil con nueva URL de avatar
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setAvatarUrl(urlData.publicUrl)
      toast({
        title: "Avatar actualizado",
        description: "Tu imagen de perfil ha sido actualizada correctamente.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir imagen",
        description: error.message,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true)

      // Actualizar perfil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          email: email,
          position: position,
          department: department,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (updateError) throw updateError

      // Actualizar información personal si existe
      if (personalInfo && personalInfo.user_id) {
        const { error: personalUpdateError } = await supabase
          .from("personal_info")
          .update({
            phone: phone,
          })
          .eq("user_id", profile.id)

        if (personalUpdateError) throw personalUpdateError
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente.",
      })

      // Recargar perfil
      const { data: refreshedProfile, error: refreshError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single()

      if (!refreshError) {
        setProfile(refreshedProfile)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar perfil",
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil de administrador...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil de Administrador</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="system">Configuración del Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta de Avatar */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>Tu imagen será visible para otros usuarios del sistema</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl || ""} alt={fullName} />
                  <AvatarFallback className="text-2xl">
                    {fullName
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2 w-full">
                  <Label htmlFor="avatar" className="cursor-pointer w-full">
                    <div className="flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-accent text-center">
                      <Upload className="h-4 w-4" />
                      <span>{uploading ? "Subiendo..." : "Cambiar imagen"}</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta de Información Personal */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Tu número de teléfono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Tu cargo en la organización"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Tu departamento"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Breve descripción sobre ti"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={updating}>
                    {updating ? "Actualizando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta de Estado de la Cuenta */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Estado de la Cuenta</CardTitle>
                <CardDescription>Información sobre el estado de tu cuenta de administrador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 p-4 border rounded-md">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Rol</p>
                      <p className="text-sm text-muted-foreground">Administrador</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border rounded-md">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Estado</p>
                      <p className="text-sm text-muted-foreground">Activo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border rounded-md">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Miembro desde</p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>Gestiona la seguridad de tu cuenta de administrador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información importante</AlertTitle>
                <AlertDescription>
                  Como administrador, tienes acceso a información sensible. Asegúrate de mantener tus credenciales
                  seguras y no compartirlas con nadie.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cambio de Contraseña</h3>
                <p className="text-sm text-muted-foreground">
                  Para cambiar tu contraseña, utiliza el enlace de restablecimiento de contraseña que se enviará a tu
                  correo electrónico.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email)
                      if (error) throw error
                      toast({
                        title: "Correo enviado",
                        description: "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.",
                      })
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message,
                      })
                    }
                  }}
                >
                  Enviar enlace de restablecimiento
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sesiones Activas</h3>
                <p className="text-sm text-muted-foreground">
                  Cierra todas las sesiones activas en otros dispositivos.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signOut({ scope: "others" })
                      if (error) throw error
                      toast({
                        title: "Sesiones cerradas",
                        description: "Todas las demás sesiones han sido cerradas correctamente.",
                      })
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message,
                      })
                    }
                  }}
                >
                  Cerrar otras sesiones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>Gestiona las preferencias del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Funcionalidad en desarrollo</AlertTitle>
                <AlertDescription>
                  Esta sección está actualmente en desarrollo. Pronto podrás configurar preferencias del sistema como
                  notificaciones, idioma y más.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estadísticas de Administración</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">Usuarios</span>
                    </div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-muted-foreground">Total de usuarios registrados</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="font-medium">Documentos</span>
                    </div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-muted-foreground">Total de documentos subidos</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="font-medium">Notificaciones</span>
                    </div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-muted-foreground">Notificaciones pendientes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
