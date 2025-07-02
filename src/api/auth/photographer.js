import express from 'express';
import multer from 'multer';
import pool from '../../db.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Actualizar perfil del fotógrafo
router.post('/actualizar', upload.single('hoja_vida'), async (req, res) => {
    const client = await pool.connect();

    try {
        const { userId, descripcion, tarifas } = req.body;
        const hojaVidaNombre = req.file?.originalname;

        if (!userId) return res.status(400).json({ error: 'Falta userId' });

        let query = 'UPDATE fotografo.fotografos SET descripcion = $1, tarifas = $2';
        const values = [descripcion, tarifas];

        if (hojaVidaNombre) {
            query += ', hoja_vida = $3 WHERE usuario_id = $4';
            values.push(hojaVidaNombre, userId);
        } else {
            query += ' WHERE usuario_id = $3';
            values.push(userId);
        }

        await client.query(query, values);
        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar fotógrafo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

export default router;
