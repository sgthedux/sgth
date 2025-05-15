-- Asegurarse de que RLS está habilitado en todas las tablas
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

-- Asegurarse de que las tablas están creadas con los campos correctos
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'Pendiente',
  profile_completed BOOLEAN DEFAULT FALSE,
  personal_info_completed BOOLEAN DEFAULT FALSE,
  education_completed BOOLEAN DEFAULT FALSE,
  experience_completed BOOLEAN DEFAULT FALSE,
  documents_completed BOOLEAN DEFAULT FALSE,
  cv_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  identification_type TEXT,
  identification_number TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Crear una política pública para permitir la creación inicial de perfiles
CREATE POLICY "Allow public profile creation" ON profiles
  FOR INSERT WITH CHECK (true);
