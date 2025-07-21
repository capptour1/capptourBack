import express from 'express';
import multer from 'multer';
import pool from '../../db.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint para actualizar perfil (existente)
router.post('/actualizar', upload.single('hoja_vida'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { userId, descripcion, tarifas } = req.body;
        if (!userId) return res.status(400).json({ error: 'Falta userId' });

        let query = 'UPDATE fotografo.fotografos SET descripcion = $1, tarifas = $2';
        const values = [descripcion, tarifas];
        let paramIndex = 3;

        if (req.file) {
            query += `, hoja_vida = $${paramIndex}`;
            values.push(req.file.originalname);
            paramIndex++;
        }

        query += ` WHERE usuario_id = $${paramIndex}`;
        values.push(userId);

        await client.query(query, values);
        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar fotógrafo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// Nuevo endpoint para obtener disponibilidad
router.get('/availability', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Falta userId' });

    try {
        const result = await pool.query(
            'SELECT is_active FROM fotografo.fotografos WHERE usuario_id = $1',
            [userId]
        );
        res.json({ is_active: result.rows[0]?.is_active ?? false });
    } catch (error) {
        console.error('Error GET /availability:', error);
        res.status(500).json({ error: 'Error al obtener disponibilidad' });
    }
});

// Nuevo endpoint para actualizar disponibilidad
router.put('/availability', async (req, res) => {
    const { userId, is_active } = req.body;
    if (!userId) return res.status(400).json({ error: 'Falta userId' });

    try {
        await pool.query(
            'UPDATE fotografo.fotografos SET is_active = $1 WHERE usuario_id = $2',
            [is_active, userId]
        );
        res.json({ success: true, is_active });
    } catch (error) {
        console.error('Error PUT /availability:', error);
        res.status(500).json({ error: 'Error al actualizar disponibilidad' });
    }
});

export default router;