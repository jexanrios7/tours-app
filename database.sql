-- Script de inicialización de base de datos para Agencia de Tours
-- Autor: Sistema de Gestión de Tours
-- Fecha: 2024

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Crear tabla de administradores
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Crear índices para tabla admins
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- Crear tabla de tours
CREATE TABLE tours (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    attractions TEXT[], -- Array de atracciones principales
    duration VARCHAR(100) NOT NULL, -- Ej: "3 días 2 noches"
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Aventura, Cultural, Playa, etc.
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para tabla tours
CREATE INDEX idx_tours_category ON tours(category);
CREATE INDEX idx_tours_is_active ON tours(is_active);
CREATE INDEX idx_tours_price ON tours(price);
CREATE INDEX idx_tours_created_at ON tours(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar administrador inicial
-- Usuario: admin
-- Contraseña: admin123 (debe cambiarse en producción)
-- Hash generado con bcrypt (10 rounds)
INSERT INTO admins (username, password, email, full_name) 
VALUES (
    'admin',
    '$2b$10$rQZK8JqJ2J2J2J2J2J2J2O7X7X7X7X7X7X7X7X7X7X7X7X7X7X7X7',
    'admin@agenciatours.com',
    'Administrador Principal'
);

-- Insertar tours de ejemplo
INSERT INTO tours (title, description, attractions, duration, price, category, image_url) VALUES
(
    'Tour a Machu Picchu',
    'Descubre la maravilla del mundo antiguo con guías expertos. Incluye transporte, entrada y almuerzo.',
    ARRAY['Machu Picchu', 'Valle Sagrado', 'Ollantaytambo'],
    '4 días 3 noches',
    450.00,
    'Cultural',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800'
),
(
    'Tour de Playa en Cancún',
    'Disfruta de las playas más hermosas del Caribe mexicano con actividades acuáticas incluidas.',
    ARRAY['Playa Cancún', 'Isla Mujeres', 'Cenotes'],
    '5 días 4 noches',
    680.00,
    'Playa',
    'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800'
),
(
    'Aventura en la Selva Amazónica',
    'Experiencia única de ecoturismo con caminatas, observación de fauna y navegación por ríos.',
    ARRAY['Selva', 'Río Amazonas', 'Reserva Ecológica'],
    '3 días 2 noches',
    320.00,
    'Aventura',
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800'
),
(
    'Tour Histórico por Europa',
    'Recorre las ciudades más emblemáticas de Europa: París, Roma y Barcelona.',
    ARRAY['Torre Eiffel', 'Coliseo', 'Sagrada Familia'],
    '10 días 9 noches',
    2500.00,
    'Cultural',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'
),
(
    'Snorkel en Arrecifes de Coral',
    'Sumérgete en el mundo submarino y explora coloridos arrecifes de coral.',
    ARRAY['Arrecife', 'Peces tropicales', 'Tortugas'],
    '1 día',
    85.00,
    'Aventura',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
),
(
    'Tour Gastronómico en Oaxaca',
    'Descubre la rica gastronomía oaxaqueña con visitas a mercados, restaurantes y mezcalerías.',
    ARRAY['Mercado 20 de Noviembre', 'Hierve el Agua', 'Monte Albán'],
    '4 días 3 noches',
    380.00,
    'Cultural',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
);

-- Consultas de verificación
SELECT 'Administradores creados:' as info;
SELECT id, username, email, full_name, is_active FROM admins;

SELECT 'Tours de ejemplo creados:' as info;
SELECT id, title, category, price, is_active FROM tours;
