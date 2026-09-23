require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const { testConnection } = require('./config/db');

const tourRoutes = require('./routes/tourRoutes');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy para Render
app.set('trust proxy', true);

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://source.unsplash.com", "https://media.giphy.com", "https://*.giphy.com"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tu-dominio.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting para prevenir ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite por IP
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Aplicar rate limiting a todas las rutas
app.use('/api/', limiter);

// Configuración de Multer para carga de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Rate limiting más estricto para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // máximo 150 intentos de login (aumentado para desarrollo)
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta más tarde.'
    }
});

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/tours', tourRoutes);

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para panel admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para subir imágenes
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No se proporcionó ninguna imagen'
        });
    }
    
    res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        imageUrl: `/uploads/${req.file.filename}`
    });
});

// Montar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/contacts', contactRoutes);

// Manejo de rutas no encontradas (API)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Probar conexión a base de datos
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.warn('⚠️  No se pudo conectar a PostgreSQL. El servidor iniciará pero la API no funcionará correctamente.');
        }
        
        app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado exitosamente');
            console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
            console.log(`🌐 Vista pública: http://localhost:${PORT}`);
            console.log(`🔐 Login admin: http://localhost:${PORT}/login`);
            console.log(`⚙️  Panel admin: http://localhost:${PORT}/admin`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
            console.log(`\n📝 Credenciales por defecto:`);
            console.log(`   Usuario: admin`);
            console.log(`   Contraseña: admin123`);
            console.log(`\n⚠️  IMPORTANTE: Cambia la contraseña del admin en producción.`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

testConnection().then(async success => {
    console.log('🔍 Conexión a base de datos:', success);
    if (success) {
        // Ejecutar migraciones necesarias
        console.log('🚀 Iniciando migraciones...');
        try {
            // Crear tabla admins si no existe
            console.log('📝 Creando tabla admins...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    full_name VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla admins creada o ya existe');

            // Crear tabla tours si no existe
            console.log('📝 Creando tabla tours...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS tours (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    attractions TEXT[],
                    duration VARCHAR(50),
                    price DECIMAL(10, 2),
                    category VARCHAR(50),
                    image_url TEXT,
                    capacity INTEGER,
                    tour_date DATE,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla tours creada o ya existe');

            // Crear tabla contacts si no existe
            console.log('📝 Creando tabla contacts...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla contacts creada o ya existe');

            // Agregar columna is_read a contacts si no existe
            await pool.query(`
                ALTER TABLE contacts 
                ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Migración de contacts.is_read ejecutada');

            // Insertar admin por defecto si no existe
            console.log('📝 Verificando admin por defecto...');
            const adminExists = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
            if (adminExists.rows.length === 0) {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(`
                    INSERT INTO admins (username, password, email, full_name, is_active)
                    VALUES ($1, $2, $3, $4, $5)
                `, ['admin', hashedPassword, 'admin@tours.com', 'Administrador', true]);
                console.log('✅ Admin por defecto creado (admin/admin123)');
            } else {
                console.log('ℹ️  Admin por defecto ya existe');
            }
            console.log('✅ Migraciones completadas exitosamente');
        } catch (error) {
            console.error('❌ Error en migraciones:', error);
            console.error('Error details:', error.message);
        }
        
        startServer();
    } else {
        console.error('No se pudo iniciar el servidor debido a error de conexión a la base de datos');
        process.exit(1);
    }
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando servidor gracefulmente...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recibido. Cerrando servidor...');
    process.exit(0);
});
