require('dotenv').config();
console.log('🔧 Iniciando servidor...');
console.log('🔧 Variables de entorno cargadas');
console.log('🔧 DB_HOST:', process.env.DB_HOST);
console.log('🔧 DB_PORT:', process.env.DB_PORT);
console.log('🔧 DB_NAME:', process.env.DB_NAME);
console.log('🔧 DB_USER:', process.env.DB_USER);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection, pool } = require('./config/db');
const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://source.unsplash.com", "https://media.giphy.com", "https://*.giphy.com", "https://placehold.co"],
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

// Endpoint para ejecutar migraciones manualmente
app.get('/api/migrate', async (req, res) => {
    try {
        await runMigrations();
        res.json({
            success: true,
            message: 'Migraciones ejecutadas exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar migraciones',
            error: error.message
        });
    }
});

// Endpoint para limpiar URLs de imágenes locales
app.post('/api/cleanup-local-images', async (req, res) => {
    try {
        console.log('🧹 Limpiando URLs de imágenes locales...');
        
        // Actualizar tours que tienen URLs locales
        const result = await pool.query(`
            UPDATE tours 
            SET image_url = NULL 
            WHERE image_url LIKE '/uploads/%'
        `);
        
        console.log(`✅ Se limpiaron ${result.rowCount} URLs de imágenes locales`);
        
        res.json({
            success: true,
            message: `Se limpiaron ${result.rowCount} URLs de imágenes locales`,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error al limpiar imágenes locales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar imágenes locales'
        });
    }
});

// Endpoint para verificar si las tablas existen
app.get('/api/check-tables', async (req, res) => {
    try {
        const adminsCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admins'
            )
        `);
        
        const toursCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'tours'
            )
        `);
        
        const contactsCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'contacts'
            )
        `);
        
        res.json({
            success: true,
            tables: {
                admins: adminsCheck.rows[0].exists,
                tours: toursCheck.rows[0].exists,
                contacts: contactsCheck.rows[0].exists
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar tablas',
            error: error.message
        });
    }
});

// Endpoint para verificar si el admin existe
app.get('/api/check-admin', async (req, res) => {
    try {
        const adminCheck = await pool.query('SELECT id, username, email FROM admins WHERE username = $1', ['admin']);
        
        if (adminCheck.rows.length > 0) {
            res.json({
                success: true,
                adminExists: true,
                admin: {
                    id: adminCheck.rows[0].id,
                    username: adminCheck.rows[0].username,
                    email: adminCheck.rows[0].email
                }
            });
        } else {
            res.json({
                success: true,
                adminExists: false
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar admin',
            error: error.message
        });
    }
});

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

// Ejecutar migraciones al iniciar
const runMigrations = async () => {
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
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla admins creada o ya existe');

        // Agregar columna last_login a admins si no existe
        await pool.query(`
            ALTER TABLE admins 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
        `);
        console.log('✅ Migración de admins.last_login ejecutada');

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

        // Crear tabla tour_images si no existe
        console.log('📝 Creando tabla tour_images...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_images (
                id SERIAL PRIMARY KEY,
                tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla tour_images creada o ya existe');

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
};

testConnection().then(async success => {
    console.log('🔍 Conexión a base de datos:', success);
    // Ejecutar migraciones siempre, independientemente del resultado de testConnection
    await runMigrations();
    startServer();
}).catch(error => {
    console.error('❌ Error al conectar a base de datos:', error);
    // Intentar ejecutar migraciones de todas formas
    runMigrations().then(() => {
        startServer();
    }).catch(err => {
        console.error('❌ Error crítico:', err);
        process.exit(1);
    });
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
