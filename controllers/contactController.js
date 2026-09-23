const { pool } = require('../config/db');

// Crear mensaje de contacto
const createContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        // Validar campos requeridos
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y mensaje son requeridos'
            });
        }
        
        // Insertar en base de datos
        const query = `
            INSERT INTO contacts (name, email, phone, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [name, email, phone || null, message];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el mensaje'
        });
    }
};

// Obtener todos los contactos (solo admin)
const getAllContacts = async (req, res) => {
    try {
        const query = `
            SELECT * FROM contacts 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los contactos'
        });
    }
};

// Marcar contacto como leído
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            UPDATE contacts 
            SET is_read = TRUE 
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Contacto marcado como leído',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al marcar contacto como leído:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el contacto'
        });
    }
};

// Eliminar contacto
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM contacts WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Contacto eliminado correctamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el contacto'
        });
    }
};

module.exports = {
    createContact,
    getAllContacts,
    markAsRead,
    deleteContact
};
