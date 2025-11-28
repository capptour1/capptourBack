import express from 'express';
import db from '../../../db.js';

const router = express.Router();

// POST /api/photos/immediate/save
router.post('/save', async (req, res) => {
    try {
        const { fotografo_id, foto_url } = req.body;
        const usuario_id = req.user.userId; // ID del usuario autenticado (cliente)

        // Validar que los IDs existen
        const userCheck = await db.query('SELECT id FROM auth.usuarios WHERE id = $1', [usuario_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const fotografoCheck = await db.query('SELECT id FROM fotografo.fotografos WHERE id = $1', [fotografo_id]);
        if (fotografoCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Fotógrafo no encontrado' });
        }

        // Insertar la foto inmediata
        const query = `
      INSERT INTO fotografo.fotos_inmediatas (fotografo_id, usuario_id, foto_url)
      VALUES ($1, $2, $3) 
      RETURNING *
    `;

        const result = await db.query(query, [fotografo_id, usuario_id, foto_url]);

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error guardando foto inmediata:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GET /api/photos/immediate/photographer/:id - Obtener fotógrafo por ID (público)
router.get('/photographer/:id', async (req, res) => {
    try {
        const usuarioId = req.params.id; // ← Ahora es usuario_id

        //  CONSULTA CORREGIDA - buscar por usuario_id
        const query = `
            SELECT 
                u.id,                    -- ← Devolver usuario_id como id
                u.nombre_completo AS nombre,
                u.email,
                f.id as fotografo_id     -- ← Y también el fotografo_id por si acaso
            FROM auth.usuarios u
            LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
            WHERE u.id = $1 AND u.rol_id = 5  -- ← Solo fotógrafos
        `;

        const result = await db.query(query, [usuarioId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Fotógrafo no encontrado' });
        }

        const fotografo = result.rows[0];

        res.status(200).json({
            id: fotografo.id,           // ← usuario_id (35)
            fotografo_id: fotografo.fotografo_id, // ← fotografo_id (7)
            nombre: fotografo.nombre,
            email: fotografo.email
        });
    } catch (err) {
        console.error(' Error obteniendo fotógrafo:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;