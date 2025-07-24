import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 📌 Crear nueva reserva (sincroniza ambas tablas)
router.post('/', async (req, res) => {
    const { usuario_id, fotografo_id, tipo_sesion, fecha, hora, ubicacion } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 🔍 Buscar ID real del fotógrafo (por usuario_id)
        const resultFotografo = await client.query(
            'SELECT id FROM fotografo.fotografos WHERE usuario_id = $1',
            [fotografo_id]
        );

        if (resultFotografo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No se encontró fotógrafo con ese usuario_id' });
        }

        const fotografoIdReal = resultFotografo.rows[0].id;

        // ⚠️ Verificar si el fotógrafo ya tiene una reserva en ese horario
        const check = await client.query(
            `SELECT * FROM reserva.reservas 
             WHERE fotografo_id = $1 AND fecha = $2 AND hora = $3`,
            [fotografoIdReal, fecha, hora]
        );
        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Fotógrafo no disponible en ese horario' });
        }

        // ✅ Crear reserva en reserva.reservas
        const result = await client.query(
            `INSERT INTO reserva.reservas 
             (usuario_id, fotografo_id, tipo_sesion, fecha, hora, ubicacion)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [usuario_id, fotografoIdReal, tipo_sesion, fecha, hora, ubicacion]
        );
        const nuevaReserva = result.rows[0];

        // 🔁 Duplicar en fotografo.reservas
        await client.query(
            `INSERT INTO fotografo.reservas (reserva_id, fotografo_id)
             VALUES ($1, $2)`,
            [nuevaReserva.id, fotografoIdReal]
        );

        await client.query('COMMIT');
        res.status(201).json(nuevaReserva);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al crear reserva' });
    } finally {
        client.release();
    }
});

// 📌 Obtener reservas por usuario
router.get('/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                r.*, 
                fu.nombre_completo AS nombre_fotografo,
                uu.nombre_completo AS nombre_usuario
             FROM reserva.reservas r
             JOIN fotografo.fotografos f ON r.fotografo_id = f.id
             JOIN auth.usuarios fu ON f.usuario_id = fu.id
             JOIN auth.usuarios uu ON r.usuario_id = uu.id
             WHERE r.usuario_id = $1
             ORDER BY r.fecha DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

// 📌 Eliminar reserva (de ambas tablas)
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM fotografo.reservas WHERE reserva_id = $1',
            [req.params.id]
        );

        await client.query(
            'DELETE FROM reserva.reservas WHERE id = $1',
            [req.params.id]
        );

        await client.query('COMMIT');
        res.sendStatus(204);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar reserva' });
    } finally {
        client.release();
    }
});

// 📌 Editar reserva
router.put('/:id', async (req, res) => {
    const { tipo_sesion, fecha, hora, ubicacion } = req.body;

    try {
        const check = await pool.query(
            `SELECT * FROM reserva.reservas 
             WHERE id <> $1 AND fecha = $2 AND hora = $3`,
            [req.params.id, fecha, hora]
        );
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Ya hay una reserva en ese horario' });
        }

        const result = await pool.query(
            `UPDATE reserva.reservas
             SET tipo_sesion = $1, fecha = $2, hora = $3, ubicacion = $4
             WHERE id = $5
             RETURNING *`,
            [tipo_sesion, fecha, hora, ubicacion, req.params.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar reserva' });
    }
});

// 📌 Obtener fotógrafos disponibles
router.get('/disponibles', async (req, res) => {
    const { fecha, hora } = req.query;

    if (!fecha || !hora) {
        return res.status(400).json({ error: 'Faltan parámetros: fecha y hora' });
    }

    try {
        const result = await pool.query(`
            SELECT f.id, fu.nombre_completo
            FROM fotografo.fotografos f
            JOIN auth.usuarios fu ON f.usuario_id = fu.id
            WHERE f.is_active = true
              AND NOT EXISTS (
                SELECT 1
                FROM reserva.reservas r
                WHERE r.fotografo_id = f.id
                  AND r.fecha = $1 AND r.hora = $2
            )
        `, [fecha, hora]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener fotógrafos disponibles' });
    }
});

export default router;
