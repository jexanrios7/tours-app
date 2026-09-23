const { pool } = require('../config/db');

// Obtener todos los tours (para admin)
const getAllTours = async (req, res) => {
    try {
        const query = `
            SELECT id, title, description, attractions, duration, price, 
                   category, image_url, capacity, tour_date, is_active, created_at, updated_at
            FROM tours 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
    } catch (error) {
        console.error('Error al obtener tours:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tours'
        });
    }
};

// Obtener tours activos (para frontend público)
const getActiveTours = async (req, res) => {
    try {
        const query = `
            SELECT id, title, description, attractions, duration, price, 
                   category, image_url, capacity, tour_date, is_active, created_at, updated_at
            FROM tours 
            WHERE is_active = true
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
    } catch (error) {
        console.error('Error al obtener tours activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tours activos'
        });
    }
};

// Obtener un tour por ID
const getTourById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT id, title, description, attractions, duration, price, 
                   category, image_url, capacity, tour_date, is_active, created_at, updated_at
            FROM tours 
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tour no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el tour'
        });
    }
};

// Crear un nuevo tour (solo admin)
const createTour = async (req, res) => {
    try {
        const { title, description, attractions, duration, price, category, image_url, capacity, tour_date } = req.body;
        
        // Validaciones básicas
        if (!title || !description || !duration || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser proporcionados'
            });
        }
        
        // Convertir attractions a array si es string
        const attractionsArray = Array.isArray(attractions) ? attractions : 
                                  (attractions ? attractions.split(',').map(a => a.trim()) : []);
        
        const query = `
            INSERT INTO tours (title, description, attractions, duration, price, category, image_url, capacity, tour_date, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING *
        `;
        
        const values = [
            title,
            description,
            attractionsArray,
            duration,
            price,
            category,
            image_url || null,
            capacity || 20,
            tour_date || null
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            message: 'Tour creado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el tour'
        });
    }
};

// Actualizar un tour (solo admin)
const updateTour = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, attractions, duration, price, category, image_url, is_active, capacity, tour_date } = req.body;
        
        // Convertir attractions a array si es string
        const attractionsArray = Array.isArray(attractions) ? attractions : 
                                  (attractions ? attractions.split(',').map(a => a.trim()) : null);
        
        // Construir query dinámica solo con campos que tienen valores válidos
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (title !== undefined && title !== null && title !== '') {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }
        
        if (description !== undefined && description !== null && description !== '') {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }
        
        if (attractionsArray !== undefined && attractionsArray !== null) {
            updates.push(`attractions = $${paramCount}`);
            values.push(attractionsArray);
            paramCount++;
        }
        
        if (duration !== undefined && duration !== null && duration !== '') {
            updates.push(`duration = $${paramCount}`);
            values.push(duration);
            paramCount++;
        }
        
        if (price !== undefined && price !== null) {
            updates.push(`price = $${paramCount}`);
            values.push(price);
            paramCount++;
        }
        
        if (category !== undefined && category !== null && category !== '') {
            updates.push(`category = $${paramCount}`);
            values.push(category);
            paramCount++;
        }
        
        if (image_url !== undefined) {
            updates.push(`image_url = $${paramCount}`);
            values.push(image_url);
            paramCount++;
        }
        
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            values.push(is_active);
            paramCount++;
        }
        
        if (capacity !== undefined && capacity !== null) {
            updates.push(`capacity = $${paramCount}`);
            values.push(capacity);
            paramCount++;
        }
        
        if (tour_date !== undefined) {
            updates.push(`tour_date = $${paramCount}`);
            values.push(tour_date);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }
        
        values.push(id);
        
        const query = `
            UPDATE tours 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tour no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Tour actualizado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el tour'
        });
    }
};

// Eliminar un tour (hard delete, solo admin)
const deleteTour = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            DELETE FROM tours 
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tour no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Tour eliminado permanentemente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el tour'
        });
    }
};

// Obtener estadísticas de tours (solo admin)
const getTourStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_tours,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_tours,
                AVG(price) as avg_price,
                MIN(price) as min_price,
                MAX(price) as max_price
            FROM tours
        `;
        
        const result = await pool.query(query);
        
        // Obtener tours por categoría
        const categoryQuery = `
            SELECT category, COUNT(*) as count
            FROM tours
            WHERE is_active = true
            GROUP BY category
            ORDER BY count DESC
        `;
        
        const categoryResult = await pool.query(categoryQuery);
        
        res.json({
            success: true,
            data: {
                ...result.rows[0],
                by_category: categoryResult.rows
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
};

module.exports = {
    getAllTours,
    getActiveTours,
    getTourById,
    createTour,
    updateTour,
    deleteTour,
    getTourStats
};
