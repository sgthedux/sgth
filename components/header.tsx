"use client"

import { UserNav } from "@/components/user-nav"
import { memo } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  user: {
    name: string
    email: string
    imageUrl?: string
  }
  isAdmin?: boolean
}

export const Header = memo(function Header({ user, isAdmin = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1">{/* El campo de búsqueda ha sido eliminado */}</div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserNav user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  )
})
