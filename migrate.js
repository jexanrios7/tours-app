require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigrations() {
    console.log('🚀 Iniciando migraciones...');
    console.log('🔧 DB_HOST:', process.env.DB_HOST);
    console.log('🔧 DB_PORT:', process.env.DB_PORT);
    console.log('🔧 DB_NAME:', process.env.DB_NAME);
    console.log('🔧 DB_USER:', process.env.DB_USER);
    
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
        const bcrypt = require('bcrypt');
        const adminExists = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
        if (adminExists.rows.length === 0) {
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
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en migraciones:', error);
        console.error('Error details:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigrations();
