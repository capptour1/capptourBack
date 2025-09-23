import express from 'express';
import db from '../../db.js';

const router = express.Router();

// GET /api/usuario/datos - Obtener datos del usuario logueado
router.get('/datos', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const usuarioId = req.user.userId;

        const query = `
            SELECT id, nombre_completo, email 
            FROM auth.usuarios 
            WHERE id = $1
        `;

        const result = await db.query(query, [usuarioId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];

        res.status(200).json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email
            }
        });
    } catch (err) {
        console.error('Error obteniendo datos usuario:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;