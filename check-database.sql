-- Verificar estructura de la tabla tours
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tours' 
ORDER BY ordinal_position;

-- Verificar datos actuales
SELECT id, title, capacity, tour_date, is_active, created_at 
FROM tours 
ORDER BY created_at DESC 
LIMIT 10;
