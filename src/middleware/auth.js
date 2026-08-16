import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';

const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

/**
 * Middleware de autenticación JWT para rutas HTTP.
 * Extrae el token del header Authorization (Bearer <token>)
 * y establece req.user = { id, role }.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export default authMiddleware;
