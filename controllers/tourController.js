const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;

// Helper para subir imagen a Cloudinary
const uploadImageToCloudinary = async (file) => {
    try {
        if (!file) return null;
        
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'tours-app',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                    max_file_size: 5000000 // 5MB
                },
                (error, result) => {
                    if (error) {
                        console.error('Error en upload_stream:', error);
                        reject(error);
                    } else {
                        resolve(result.secure_url);
                    }
                }
            ).end(file.buffer);
        });
    } catch (error) {
        console.error('Error al subir imagen a Cloudinary:', error);
        throw new Error('Error al subir la imagen');
    }
};

// Helper para subir múltiples imágenes a Cloudinary
const uploadMultipleImagesToCloudinary = async (files) => {
    try {
        if (!files || files.length === 0) return [];
        
        const uploadPromises = files.map(file => uploadImageToCloudinary(file));
        const urls = await Promise.all(uploadPromises);
        return urls.filter(url => url !== null);
    } catch (error) {
        console.error('Error al subir imágenes a Cloudinary:', error);
        throw new Error('Error al subir las imágenes');
    }
};

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
        const { title, description, attractions, duration, price, category, image_url, capacity, tour_date, is_active } = req.body;
        
        // Validaciones básicas
        if (!title || !description || !duration || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser proporcionados'
            });
        }
        
        // Subir imagen principal a Cloudinary si se proporcionó un archivo
        let finalImageUrl = image_url || null;
        if (req.file) {
            finalImageUrl = await uploadImageToCloudinary(req.file);
        }
        
        // Subir imágenes adicionales si se proporcionaron
        let additionalImages = [];
        if (req.files && req.files.length > 0) {
            additionalImages = await uploadMultipleImagesToCloudinary(req.files);
        }
        
        // Convertir attractions a array si es string
        const attractionsArray = Array.isArray(attractions) ? attractions : 
                                  (attractions ? attractions.split(',').map(a => a.trim()) : []);
        
        const query = `
            INSERT INTO tours (title, description, attractions, duration, price, category, image_url, capacity, tour_date, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const values = [
            title,
            description,
            attractionsArray,
            duration,
            price,
            category,
            finalImageUrl,
            capacity || 20,
            tour_date || null,
            is_active === undefined ? true : (is_active === true || is_active === 'true')
        ];
        
        const result = await pool.query(query, values);
        const tour = result.rows[0];
        
        // Insertar imágenes adicionales en tour_images
        if (additionalImages.length > 0) {
            for (let i = 0; i < additionalImages.length; i++) {
                await pool.query(
                    'INSERT INTO tour_images (tour_id, image_url, display_order) VALUES ($1, $2, $3)',
                    [tour.id, additionalImages[i], i]
                );
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Tour creado exitosamente',
            data: tour
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
        
        // Subir imagen a Cloudinary si se proporcionó un archivo
        let finalImageUrl = image_url;
        if (req.file) {
            finalImageUrl = await uploadImageToCloudinary(req.file);
        }
        if (finalImageUrl === '') {
            finalImageUrl = null;
        }
        
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
        
        if (price !== undefined && price !== null && price !== '') {
            updates.push(`price = $${paramCount}`);
            values.push(price);
            paramCount++;
        }
        
        if (category !== undefined && category !== null && category !== '') {
            updates.push(`category = $${paramCount}`);
            values.push(category);
            paramCount++;
        }
        
        if (finalImageUrl !== undefined) {
            updates.push(`image_url = $${paramCount}`);
            values.push(finalImageUrl);
            paramCount++;
        }
        
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            values.push(is_active === true || is_active === 'true');
            paramCount++;
        }
        
        if (capacity !== undefined && capacity !== null && capacity !== '') {
            updates.push(`capacity = $${paramCount}`);
            values.push(capacity);
            paramCount++;
        }
        
        if (tour_date !== undefined) {
            updates.push(`tour_date = $${paramCount}`);
            values.push(tour_date === '' ? null : tour_date);
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

// Obtener imágenes de un tour
const getTourImages = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT id, image_url, display_order, created_at
            FROM tour_images
            WHERE tour_id = $1
            ORDER BY display_order ASC, created_at ASC
        `;
        
        const result = await pool.query(query, [id]);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al obtener imágenes del tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las imágenes del tour'
        });
    }
};

// Agregar imágenes a un tour
const addTourImages = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron imágenes'
            });
        }
        
        const uploadedImages = await uploadMultipleImagesToCloudinary(req.files);
        
        // Obtener el display_order máximo actual
        const maxOrderResult = await pool.query(
            'SELECT COALESCE(MAX(display_order), -1) as max_order FROM tour_images WHERE tour_id = $1',
            [id]
        );
        const maxOrder = maxOrderResult.rows[0].max_order;
        
        // Insertar las nuevas imágenes
        for (let i = 0; i < uploadedImages.length; i++) {
            await pool.query(
                'INSERT INTO tour_images (tour_id, image_url, display_order) VALUES ($1, $2, $3)',
                [id, uploadedImages[i], maxOrder + i + 1]
            );
        }
        
        res.json({
            success: true,
            message: 'Imágenes agregadas exitosamente',
            count: uploadedImages.length
        });
    } catch (error) {
        console.error('Error al agregar imágenes al tour:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar las imágenes'
        });
    }
};

// Eliminar una imagen de un tour
const deleteTourImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM tour_images WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Imagen no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la imagen'
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
    getTourStats,
    getTourImages,
    addTourImages,
    deleteTourImage
};
