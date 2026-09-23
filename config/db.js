const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo de espera para conexiones inactivas
    connectionTimeoutMillis: 2000, // Tiempo de espera para establecer conexión
});

// Manejo de errores de conexión
pool.on('error', (err) => {
    console.error('Error inesperado en el cliente de PostgreSQL:', err);
    process.exit(-1);
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexión a PostgreSQL establecida:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a PostgreSQL:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};
