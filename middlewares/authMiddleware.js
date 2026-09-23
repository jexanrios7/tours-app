const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso denegado. Token no proporcionado.' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido o expirado.' 
            });
        }

        req.user = decoded;
        next();
    });
};

// Middleware opcional para verificar si es admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requieren privilegios de administrador.' 
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin
};
