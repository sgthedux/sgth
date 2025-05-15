-- Script para crear instituciones educativas comunes en Colombia
-- Este script inserta algunas de las universidades más reconocidas de Colombia

-- Primero, asegurarse de que la tabla institutions existe
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ies_code TEXT,
  country TEXT DEFAULT 'Colombia',
  country_code TEXT DEFAULT '170',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar universidades con sus códigos SNIES
INSERT INTO institutions (id, name, ies_code) VALUES
('UNAL', 'Universidad Nacional de Colombia', '1101'),
('UDEA', 'Universidad de Antioquia', '1201'),
('UNIANDES', 'Universidad de los Andes', '1102'),
('JAVERIANA', 'Pontificia Universidad Javeriana', '1103'),
('UNIVALLE', 'Universidad del Valle', '1104'),
('UIS', 'Universidad Industrial de Santander', '1105'),
('UNINORTE', 'Universidad del Norte', '1106'),
('UROSARIO', 'Universidad del Rosario', '1107'),
('EAFIT', 'Universidad EAFIT', '1108'),
('UPB', 'Universidad Pontificia Bolivariana', '1109'),
('UTEDE', 'Universidad Tecnológica de Educación', '1110'),
('UEXTERNADO', 'Universidad Externado de Colombia', '1111'),
('USABANA', 'Universidad de La Sabana', '1112'),
('UDISTRITAL', 'Universidad Distrital Francisco José de Caldas', '1113'),
('UNICAUCA', 'Universidad del Cauca', '1114'),
('UNIATLANTICO', 'Universidad del Atlántico', '1115'),
('UNIMAGDALENA', 'Universidad del Magdalena', '1116'),
('UNICARTAGENA', 'Universidad de Cartagena', '1117'),
('UNIPAMPLONA', 'Universidad de Pamplona', '1118'),
('UNILLANOS', 'Universidad de los Llanos', '1119'),
('UNISUCRE', 'Universidad de Sucre', '1120'),
('UNIGUAJIRA', 'Universidad de La Guajira', '1121'),
('UNICORDOBA', 'Universidad de Córdoba', '1122'),
('UNIAMAZONIA', 'Universidad de la Amazonia', '1123'),
('UNICHOCO', 'Universidad Tecnológica del Chocó', '1124'),
('UNIPACÍFICO', 'Universidad del Pacífico', '1125'),
('UNIMINUTO', 'Corporación Universitaria Minuto de Dios', '1126'),
('UNIAUTONOMA', 'Universidad Autónoma de Occidente', '1127'),
('UCENTRAL', 'Universidad Central', '1128'),
('UMANIZALES', 'Universidad de Manizales', '1129'),
('UCATOLICA', 'Universidad Católica de Colombia', '1130')
ON CONFLICT (id) DO NOTHING;

-- Insertar algunas universidades extranjeras comunes
INSERT INTO institutions (id, name, ies_code, country, country_code) VALUES
('MIT', 'Massachusetts Institute of Technology', NULL, 'Estados Unidos', '840'),
('HARVARD', 'Harvard University', NULL, 'Estados Unidos', '840'),
('STANFORD', 'Stanford University', NULL, 'Estados Unidos', '840'),
('OXFORD', 'University of Oxford', NULL, 'Reino Unido', '826'),
('CAMBRIDGE', 'University of Cambridge', NULL, 'Reino Unido', '826'),
('SORBONNE', 'Université Paris-Sorbonne', NULL, 'Francia', '250'),
('UBA', 'Universidad de Buenos Aires', NULL, 'Argentina', '032'),
('UNAM', 'Universidad Nacional Autónoma de México', NULL, 'México', '484'),
('USP', 'Universidade de São Paulo', NULL, 'Brasil', '076'),
('UChile', 'Universidad de Chile', NULL, 'Chile', '152')
ON CONFLICT (id) DO NOTHING;
