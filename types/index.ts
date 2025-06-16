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

// Tipos para el sistema de licencias
export interface LicenseRequest {
  id?: string // UUID
  user_id?: string | null // UUID del usuario autenticado
  radicado?: string // Se genera en backend
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string // ISO Date string yyyy-MM-dd
  fecha_finalizacion: string // ISO Date string yyyy-MM-dd
  observacion?: string | null
  estado?: string // Pendiente, Aprobado, Rechazado. Se asigna en backend o por defecto.
  created_at?: string // ISO Timestamptz
  updated_at?: string // ISO Timestamptz
  evidences?: LicenseEvidence[]
}

export interface LicenseEvidence {
  id?: string // UUID
  license_request_id: string // UUID
  file_name: string
  file_url: string // URL pública o firmada
  file_type?: string | null
  file_size_bytes?: number | null
  uploaded_at?: string // ISO Timestamptz
}

// Para el formulario, antes de enviar a la API
export type LicenseRequestFormData = Omit<
  LicenseRequest,
  "id" | "radicado" | "estado" | "created_at" | "updated_at" | "evidences" | "user_id"
> & {
  evidences: File[] // Array de archivos para subir
}

// Para los items de un catálogo (ej. tipo_documento)
export interface CatalogItem {
  id: string | number
  name: string
}
