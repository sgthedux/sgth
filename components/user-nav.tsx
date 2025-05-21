"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"
import { memo, useState } from "react"
import { Loader2 } from "lucide-react"

interface UserNavProps {
  user: {
    name: string
    email: string
    imageUrl?: string
  }
  isAdmin?: boolean
}

export const UserNav = memo(function UserNav({ user, isAdmin = false }: UserNavProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error al cerrar sesión:", error.message)
        throw error
      }

      // Limpiar cualquier estado local o cookies si es necesario
      localStorage.removeItem("supabase.auth.token")

      // Pequeña pausa para asegurar que todo se procese
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Redirigir al usuario a la página de inicio de sesión
      window.location.href = "/auth/login"

      // No usamos router.push aquí porque queremos un refresh completo
      // router.push("/auth/login")
      // router.refresh()
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error)
      alert("Hubo un problema al cerrar sesión. Por favor, intenta de nuevo.")
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(isAdmin ? "/admin/profile" : "/profile")}>
            Perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-red-500 focus:text-red-500">
          {isSigningOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cerrando sesión...
            </>
          ) : (
            "Cerrar sesión"
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
