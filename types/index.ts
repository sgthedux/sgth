export interface User {
  id: string
  email: string
  name?: string
  imageUrl?: string
  role?: string
  status?: string
  created_at?: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  avatar_url?: string
  role?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface Document {
  id: string
  user_id: string
  name: string
  type: string
  url: string
  status: "Pendiente" | "Aprobado" | "Rechazado"
  created_at: string
  updated_at?: string
}
