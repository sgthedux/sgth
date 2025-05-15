-- Añadir campos faltantes a la tabla de experiencia
ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS sector text CHECK (sector IN ('public', 'private', 'independent'));
