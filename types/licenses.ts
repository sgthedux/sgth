export interface LicenseRequest {
  id: string
  radicado: string
  user_id: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string
  fecha_finalizacion: string
  observacion?: string
  estado: "pendiente" | "aprobada" | "rechazada" | "en_revision"
  fecha_creacion: string
  fecha_actualizacion: string
  created_by?: string
  updated_by?: string
}

export interface LicenseEvidence {
  id: string
  license_request_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  uploaded_at: string
}

export interface CreateLicenseRequestData {
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string
  fecha_finalizacion: string
  observacion?: string
  evidences?: File[]
}

export interface LicenseRequestWithEvidences extends LicenseRequest {
  evidences: LicenseEvidence[]
}
