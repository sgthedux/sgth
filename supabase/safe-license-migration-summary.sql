-- RESUMEN DE CAMBIOS SEGUROS - SOLO AFECTA TABLAS DE LICENCIAS
-- Este script es 100% seguro para tu base de datos existente

-- ✅ CAMBIOS EN license_requests (si las columnas no existen):
-- - Agrega: fecha_creacion, fecha_actualizacion, created_by, updated_by
-- - NO modifica datos existentes
-- - NO elimina columnas

-- ✅ CAMBIOS EN license_evidences (si las columnas no existen):
-- - Agrega: file_path, uploaded_at  
-- - NO modifica datos existentes
-- - NO elimina columnas

-- ✅ FUNCIONES NUEVAS (no afectan otras tablas):
-- - generate_radicado() - Solo para generar números únicos
-- - update_license_request_timestamp() - Solo para licencias

-- ✅ TRIGGERS NUEVOS (solo para licencias):
-- - update_license_requests_timestamp - Solo en license_requests

-- ✅ ÍNDICES NUEVOS (mejoran rendimiento, no afectan datos):
-- - Solo en tablas de licencias

-- ✅ POLÍTICAS RLS (solo para licencias):
-- - Solo afectan license_requests y license_evidences

-- ❌ NO TOCA ESTAS TABLAS (100% SEGURAS):
-- experience, education, documents, profiles, personal_info,
-- languages, institutions, academic_modalities, document_types,
-- marital_status, auth.users

-- VERIFICACIÓN ADICIONAL: El script usa IF NOT EXISTS
-- para evitar errores si algo ya existe
