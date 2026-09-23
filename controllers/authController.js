const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login de administrador
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validaciones básicas
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }
        
        // Buscar administrador en la base de datos
        const query = `
            SELECT id, username, password, email, full_name, is_active
            FROM admins 
            WHERE username = $1
        `;
        
        const result = await pool.query(query, [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const admin = result.rows[0];
        
        // Verificar si el admin está activo
        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta de administrador desactivada'
            });
        }
        
        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Actualizar último login
        await pool.query(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id: admin.id, 
                username: admin.username, 
                role: 'admin' 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                full_name: admin.full_name
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el login'
        });
    }
};

// Verificar token (para validar sesión en frontend)
const verifyToken = async (req, res) => {
    try {
        // El middleware authenticateToken ya validó el token
        const adminId = req.user.id;
        
        const query = `
            SELECT id, username, email, full_name, is_active
            FROM admins 
            WHERE id = $1 AND is_active = true
        `;
        
        const result = await pool.query(query, [adminId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrador no encontrado'
            });
        }
        
        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar token'
        });
    }
};

// Cambiar contraseña del administrador
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.user.id;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son requeridas'
            });
        }
        
        // Validar longitud de nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Obtener contraseña actual
        const query = 'SELECT password FROM admins WHERE id = $1';
        const result = await pool.query(query, [adminId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrador no encontrado'
            });
        }
        
        // Verificar contraseña actual
        const isPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }
        
        // Hash de nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        await pool.query(
            'UPDATE admins SET password = $1 WHERE id = $2',
            [hashedPassword, adminId]
        );
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar la contraseña'
        });
    }
};

// Crear nuevo administrador (solo super admin o primer setup)
const createAdmin = async (req, res) => {
    try {
        const { username, password, email, full_name } = req.body;
        
        // Validaciones
        if (!username || !password || !email || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await pool.query(
            'SELECT id FROM admins WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El usuario o email ya existe'
            });
        }
        
        // Hash de contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar nuevo administrador
        const query = `
            INSERT INTO admins (username, password, email, full_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, full_name, created_at
        `;
        
        const result = await pool.query(query, [username, hashedPassword, email, full_name]);
        
        res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear administrador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el administrador'
        });
    }
};

module.exports = {
    login,
    verifyToken,
    changePassword,
    createAdmin
};
