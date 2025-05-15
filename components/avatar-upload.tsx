"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AvatarUploadProps {
  userId: string
  initialImage: string | null
  onImageUpdated: (url: string) => void
}

export function AvatarUpload({ userId, initialImage, onImageUpdated }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImage)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen")
      }

      const file = event.target.files[0]

      // Verificar tamaño máximo (200KB)
      if (file.size > 200 * 1024) {
        throw new Error("La imagen no debe exceder los 200KB")
      }

      // Crear FormData para la subida a Cloudflare R2
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)
      formData.append("category", "avatars")
      formData.append("itemId", "profile")

      // Subir a Cloudflare R2 usando la API existente
      const response = await fetch("/api/upload-direct", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir imagen")
      }

      const { public_url } = await response.json()
      console.log("Imagen subida correctamente a Cloudflare R2:", public_url)

      // Actualizar avatar_url en la tabla profiles
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: public_url }).eq("id", userId)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(public_url)
      onImageUpdated(public_url)
    } catch (error) {
      console.error("Error al subir avatar:", error)
      alert(`Error al subir avatar: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-32 h-32 border-2 border-primary/20">
        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
        <AvatarFallback className="text-2xl bg-primary/10">
          {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : getInitials(userId)}
        </AvatarFallback>
      </Avatar>

      <input type="file" id="avatar" ref={fileInputRef} accept="image/*" onChange={uploadAvatar} className="hidden" />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Camera className="mr-2 h-4 w-4" />
        {uploading ? "Subiendo a Cloudflare..." : "Cambiar Imagen"}
      </Button>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
