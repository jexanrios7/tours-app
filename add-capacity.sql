-- Agregar campo capacity a la tabla tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20;

-- Activar todos los tours existentes
UPDATE tours SET is_active = TRUE WHERE is_active = FALSE;

-- Verificar cambios
SELECT id, title, is_active, capacity FROM tours;
