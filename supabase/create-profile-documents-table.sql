-- Create profile_documents table to store document uploads for profile forms
CREATE TABLE IF NOT EXISTS profile_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'experience_certificate', 'education_certificate', 'language_certificate'
    form_type VARCHAR(50) NOT NULL, -- e.g., 'experience', 'education', 'language'
    item_index INTEGER, -- Index of the form item (for multiple experiences, educations, etc.)
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, document_type, form_type, item_index)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_documents_user_id ON profile_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_documents_form_type ON profile_documents(form_type);

-- Enable RLS
ALTER TABLE profile_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own documents" ON profile_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON profile_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON profile_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON profile_documents;

-- Create policies for profile_documents
CREATE POLICY "Users can insert their own documents" ON profile_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents" ON profile_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON profile_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON profile_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profile_documents_updated_at ON profile_documents;
CREATE TRIGGER update_profile_documents_updated_at
    BEFORE UPDATE ON profile_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_documents_updated_at();
