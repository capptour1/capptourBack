import express from 'express';
import multer from 'multer';
import pool from '../../db.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(express.json()); // Middleware esencial

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

    // Validación reforzada
    if (!userId || is_active === undefined) {
        return res.status(400).json({
            error: 'Datos requeridos',
            solution: 'Enviar {userId: number, is_active: string}'
        });
    }

    try {
        // Conversión infalible a booleano
        const isActive = String(is_active).toLowerCase() === 'true';

        // Query con nombre de columna exacto (ajusta si tu columna se llama diferente)
        const result = await pool.query(
            `UPDATE fotografo.fotografos 
       SET is_active = $1, 
           updated_at = NOW()
       WHERE usuario_id = $2
       RETURNING is_active`,
            [isActive, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Fotógrafo no encontrado' });
        }

        res.json({
            success: true,
            is_active: result.rows[0].is_active
        });

    } catch (error) {
        console.error('Error en DB:', {
            message: error.message,
            query: error.query // Muestra la consulta fallida
        });

        res.status(500).json({
            error: 'Error interno',
            hint: 'Revisar logs del servidor',
            detail: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

router.get('/list', async (req, res) => {
    const client = await pool.connect();

    try {
        const result = await client.query(`
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.telefono,
        f.id AS photographer_id,         -- 👈 necesario para traer sus fotos
        f.descripcion,
        f.tarifas,
        f.hoja_vida,
        f.is_active
      FROM auth.usuarios u
      INNER JOIN fotografo.fotografos f ON u.id = f.usuario_id
      WHERE u.rol_id = 5
    `);

        const rows = result.rows.map(row => ({
            ...row,
            tarifas: typeof row.tarifas === 'string' ? JSON.parse(row.tarifas) : row.tarifas
        }));

        res.json(rows);
    } catch (err) {
        console.error('Error al obtener fotógrafos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});


export default router;