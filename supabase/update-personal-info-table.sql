-- Añadir columnas para fecha y lugar de expedición del documento
ALTER TABLE personal_info 
ADD COLUMN IF NOT EXISTS document_issue_date DATE,
ADD COLUMN IF NOT EXISTS document_issue_place TEXT;
