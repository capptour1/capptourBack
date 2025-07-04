import express from 'express';
import multer from 'multer';
import pool from '../../db.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/actualizar', upload.single('hoja_vida'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { userId, descripcion, tarifas } = req.body;

        if (!userId) return res.status(400).json({ error: 'Falta userId' });

        // Empezamos con la query base y parámetros
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


export default router;
