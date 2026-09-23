-- Agregar campo is_read a la tabla contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
