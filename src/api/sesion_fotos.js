import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 📸 Crear sesión de fotos y finalizar reserva
router.post('/', async (req, res) => {
    const client = await pool.connect();
    const {
        reserva_id,
        nombre,
        descripcion,
        url_repositorio,
        observacion
    } = req.body;

    try {
        if (!reserva_id || !nombre || !url_repositorio) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        await client.query('BEGIN');

        // 1️⃣ Insertar sesión
        const insertQuery = `
            INSERT INTO fotografo.sesion_fotos (
                reserva_id,
                nombre,
                descripcion,
                url_repositorio,
                observacion
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const insertResult = await client.query(insertQuery, [
            reserva_id,
            nombre,
            descripcion,
            url_repositorio,
            observacion || null
        ]);

        // 2️⃣ Cambiar estado de la reserva a Finalizada
        const updateQuery = `
            UPDATE fotografo.reservas
            SET estado = 'finalizada'
            WHERE id = $1;
        `;

        await client.query(updateQuery, [reserva_id]);
        await client.query('COMMIT');

        res.status(201).json(insertResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al guardar sesión y finalizar reserva:', err);
        res.status(500).json({ error: 'Error al finalizar la reserva' });
    } finally {
        client.release();
    }
});


// 📥 Obtener datos del fotógrafo por ID de reserva
router.get('/:reserva_id', async (req, res) => {
    const client = await pool.connect();
    const { reserva_id } = req.params;

    try {
        const fotografoQuery = `
            SELECT 
                f.descripcion AS descripcion_fotografo,
                f.tarifas,
                u.nombre_completo AS nombre_fotografo
            FROM fotografo.reservas r
            INNER JOIN fotografo.fotografos f ON r.fotografo_id = f.usuario_id
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            WHERE r.id = $1
            LIMIT 1;
        `;

        const result = await client.query(fotografoQuery, [reserva_id]);
        const fotografo = result.rows[0];

        if (!fotografo) {
            return res.status(404).json({ error: 'No se encontró el fotógrafo' });
        }

        // 👛 Parsear tarifas si existen
        let tarifas = [];
        try {
            tarifas = typeof fotografo.tarifas === 'string'
                ? JSON.parse(fotografo.tarifas)
                : fotografo.tarifas;
        } catch (_) {
            tarifas = [];
        }

        // 🪪 Retornar datos mínimos requeridos
        res.json({
            nombre_fotografo: fotografo.nombre_fotografo ?? '',
            descripcion_sesion: '',
            url_repositorio: '',
            descripcion_fotografo: fotografo.descripcion_fotografo ?? '',
            tarifas,
        });

    } catch (err) {
        console.error('❌ Error al obtener datos del fotógrafo:', err);
        res.status(500).json({ error: 'Error interno al obtener sesión' });
    } finally {
        client.release();
    }
});

export default router;
