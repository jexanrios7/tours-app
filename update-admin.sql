-- Actualizar contraseña del administrador
UPDATE admins 
SET password = '$2b$10$UR2Plsf.pxaLO2YKcVxi1uoNrWVrmbOQvXP3AtpEte1uZYzD9WAJ2'
WHERE username = 'admin';

-- Verificar actualización
SELECT username, email, full_name, is_active FROM admins WHERE username = 'admin';
