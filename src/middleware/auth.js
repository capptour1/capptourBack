import jwt from 'jsonwebtoken';
import pool from '../db.js';

const SECRET_KEY = 'secret_key'; // Misma clave que en login

// Middleware para verificar token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user; // { userId, role }
    next();
  });
};

// Middleware para verificar rol de administrador
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar si el rol es admin (asumiendo que rol_id = 1 es admin)
    const result = await pool.query(
      'SELECT rol_id FROM auth.usuarios WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userRole = result.rows[0].rol_id;
    
    // Verificar si es admin (rol_id = 1) o superadmin si existe
    if (userRole !== 1) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }

    next();
  } catch (error) {
    console.error('Error en middleware requireAdmin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware combinado: autenticación + admin
export const adminAuth = [authenticateToken, requireAdmin];