-- Agregar campo tour_date a la tabla tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS tour_date DATE;

-- Verificar cambios
SELECT id, title, tour_date, capacity, is_active FROM tours;
