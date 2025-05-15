import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  user: {
    name?: string
    email?: string
    imageUrl?: string
  }
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  // Función para obtener las iniciales del nombre
  const getInitials = () => {
    if (user.name) {
      const nameParts = user.name.split(" ")
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return user.name.charAt(0).toUpperCase()
    }
    return user.email ? user.email.charAt(0).toUpperCase() : "?"
  }

  return (
    <Avatar className={className}>
      <AvatarImage
        src={user.imageUrl || ""}
        alt={user.name || user.email || "Usuario"}
        onError={(e) => {
          // Ocultar la imagen si hay error de carga
          ;(e.target as HTMLImageElement).style.display = "none"
        }}
      />
      <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
