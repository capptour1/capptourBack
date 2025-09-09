import express from 'express';
import pool from '../db.js';

import { emitirReserva } from '../../reservasHandler.js'
import { io, usuariosConectados } from '../../socketServer.js';

const router = express.Router();

// 📌 Crear nueva reserva (sincroniza ambas tablas)
router.post('/', async (req, res) => {
    const { usuario_id, fotografo_id, tipo_sesion, fecha, hora, ubicacion } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 🔍 Buscar ID real del fotógrafo (por usuario_id)
        const resultFotografo = await client.query(
            'SELECT id, usuario_id FROM fotografo.fotografos WHERE id = $1',
            [fotografo_id]
        );

        if (resultFotografo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No se encontró fotógrafo con ese usuario_id' });
        }

        const fotografoIdReal = resultFotografo.rows[0].id;
        const fotografoUsuarioId = resultFotografo.rows[0].usuario_id;

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
            `INSERT INTO fotografo.reservas (fotografo_id, cliente_id, fecha_hora, duracion, reserva_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [fotografoUsuarioId, usuario_id, new Date(`${fecha} ${hora}`), 30, nuevaReserva.id]
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

    const { id } = req.params;
    const { motivo, tipoUsuario } = req.body;

    try {
        await client.query('BEGIN');

        // await client.query(
        //     'DELETE FROM fotografo.reservas WHERE reserva_id = $1',
        //     [req.params.id]
        // );

        // await client.query(
        //     'DELETE FROM reserva.reservas WHERE id = $1',
        //     [req.params.id]
        // );

        // actualizar el estado a cancelada
        await client.query(
            `UPDATE reserva.reservas SET estado = 'cancelada' WHERE id = $1`,
            [req.params.id]
        );

        await client.query(
            `UPDATE fotografo.reservas 
            SET estado = 'cancelada', datos = $1 
            WHERE reserva_id = $2`,
            [JSON.stringify({ motivo, tipoUsuario }), id]
        );

        const reserva = await pool.query(
            `SELECT * FROM fotografo.reservas WHERE reserva_id = $1`,
            [id]
        );

        console.log('Información de la reserva:', reserva.rows[0]);

        // obtener todas las reservas canceladas de ese fotógrafo
        const reservasCanceladas = await pool.query(
            `SELECT * FROM fotografo.reservas WHERE cliente_id = $1 AND estado = 'cancelada'`,
            [reserva.rows[0].cliente_id]
        );

        if (reservasCanceladas.rows.length > 2) {
            await pool.query(
                `UPDATE auth.usuarios SET estado = 'I' WHERE id = $1`,
                [reserva.rows[0].cliente_id]
            );
            console.log('📥 Cliente inhabilitado:', reserva.rows[0].cliente_id);
        }



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

router.post('/solicitarInmediata', async (req, res) => {
    const { usuario_id, fotografo_id } = req.body;

    if (!usuario_id || !fotografo_id) {
        return res.status(400).json({ error: 'Faltan parámetros: usuario_id y fotografo_id' });
    }
    console.log('📥 Solicitud de reserva inmediata recibida:', { usuario_id, fotografo_id });
    const fecha_hora = new Date();
    try {
        const result = await pool.query(`
            INSERT INTO fotografo.reservas (cliente_id, fecha_hora, fotografo_id, duracion, estado, es_inmediata)
            VALUES ($1, $2, $3, 30, 'pendiente', true)
            RETURNING *
        `, [usuario_id, fecha_hora, fotografo_id]);
        console.log('✅ Reserva inmediata creada:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al solicitar reserva inmediata' });
    }
});

router.post('/verificar', async (req, res) => {
    const { usuario_id, fotografo_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID del usuario' });
    }

    //retornar solo solicitudes pendientes con menos de 10 segundos de antigüedad
    try {
        const result = await pool.query(`
            SELECT * FROM fotografo.reservas
            WHERE cliente_id = $1
              AND fotografo_id = $2
           -- AND fecha_hora > NOW() - INTERVAL '10 seconds'
            AND es_inmediata = true
            ORDER BY fecha_hora DESC
            LIMIT 1
        `, [usuario_id, fotografo_id]);


        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }
});

router.post('/cancelarInmediatasUsuario', async (req, res) => {
    // Cancelar (timeout) todas las solicitudes pendientes 
    const { usuario_id } = req.body;

    console.log('📥 POST /cancelarInmediatasUsuario recibido:', { usuario_id });
    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID de usuario' });
    }

    try {
        await pool.query(`
            UPDATE fotografo.reservas
            SET estado = 'cancelada'
            WHERE cliente_id = $1 AND estado = 'pendiente' AND es_inmediata = true
        `, [usuario_id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error en POST /cancelarInmediatasUsuario:', error);
        res.status(500).json({ error: 'Error al cancelar reservas' });
    }
});

// Usuario
router.post('/cancelarInmediata', async (req, res) => {
    const { reserva_id } = req.body;
    console.log('📥 Solicitud de cancelación de reserva inmediata recibida:', { reserva_id });
    if (!reserva_id) {
        return res.status(400).json({ error: 'Falta el ID de la reserva' });
    }

    try {
        const result = await pool.query(`
            UPDATE fotografo.reservas
            SET estado = 'cancelada'
            WHERE id = $1 AND es_inmediata = true
            RETURNING *
        `, [reserva_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada o no es una reserva inmediata' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al cancelar reserva inmediata' });
    }
});

router.post('/timeOut', async (req, res) => {
    const { reserva_id } = req.body;

    console.log('📥 POST /timeOut recibido:', { reserva_id });
    if (!reserva_id) {
        return res.status(400).json({ error: 'Falta el ID de la reserva' });
    }

    try {
        await pool.query(`
            UPDATE fotografo.reservas
            SET estado = 'cancelada'
            WHERE id = $1 AND estado = 'pendiente' AND es_inmediata = true
        `, [reserva_id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error en POST /timeOut:', error);
        res.status(500).json({ error: 'Error al cancelar reservas' });
    }
});

// Fotografo
router.post('/rechazarInmediata', async (req, res) => {
    const { reserva_id } = req.body;
    console.log('📥 Rechazo de reserva inmediata recibida:', { reserva_id });
    if (!reserva_id) {
        return res.status(400).json({ error: 'Falta el ID de la reserva' });
    }

    try {
        const result = await pool.query(`
            UPDATE fotografo.reservas
            SET estado = 'cancelada'
            WHERE id = $1 AND es_inmediata = true
            RETURNING *
        `, [reserva_id]);

        if (result.rows.length > 0) {
            const reserva = result.rows[0];
            emitirReserva(io, reserva.id, reserva);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada o no es una reserva inmediata' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al rechazar reserva inmediata' });
    }
});

router.post('/confirmarInmediata', async (req, res) => {
    const { reserva_id } = req.body;
    console.log('📥 Confirmación de reserva inmediata recibida:', { reserva_id });
    if (!reserva_id) {
        return res.status(400).json({ error: 'Falta el ID de la reserva' });
    }

    try {
        const result = await pool.query(`
            UPDATE fotografo.reservas
            SET estado = 'confirmada'
            WHERE id = $1 AND es_inmediata = true
            RETURNING *
        `, [reserva_id]);

        if (result.rows.length > 0) {
            const reserva = result.rows[0];
            emitirReserva(io, reserva.id, reserva);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada o no es una reserva inmediata' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al confirmar reserva inmediata' });
    }
});

router.post('/verificarFotografo', async (req, res) => {
    const { usuario_id } = req.body;
    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID del fotógrafo' });
    }

    try {
        const result = await pool.query(`
            SELECT fr.*, u.nombre_completo AS nombre_fotografo, uu.nombre_completo AS nombre_cliente
            FROM fotografo.reservas fr
            JOIN auth.usuarios u ON fr.fotografo_id = u.id
            JOIN auth.usuarios uu ON fr.cliente_id = uu.id
            WHERE fr.fotografo_id = $1
              AND fr.estado = 'pendiente'
             -- AND fr.fecha_hora > NOW() - INTERVAL '10 seconds'
            ORDER BY fr.fecha_hora DESC;
        `, [usuario_id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al verificar fotógrafo' });
    }
});

// Listado de sesiones para calificar fotografo
router.post('/listadoSesionesFinalizadas', async (req, res) => {
    const { usuario_id } = req.body;
    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID del fotógrafo' });
    }
    console.log('📥 Listado de sesiones finalizadas recibido:', { usuario_id });

    try {
        const result = await pool.query(`
            SELECT 
                fr.id,
                fr.fecha_hora,
                fr.estado,
                u.nombre_completo AS nombre_fotografo,
                uu.nombre_completo AS nombre_cliente,
                cs.id as id_calificacion,
                cs.calificacion,
                cs.valoracion,
                cs.fecha_creacion,
                CASE
                    WHEN cs.id IS NOT NULL THEN true
                    ELSE false
                END AS calificado
            FROM fotografo.reservas fr
            JOIN auth.usuarios u ON fr.fotografo_id = u.id
            JOIN auth.usuarios uu ON fr.cliente_id = uu.id
            LEFT JOIN fotografo.calificaciones_sesion cs ON fr.id = cs.id_reserva
            WHERE fr.cliente_id = $1
            AND fr.estado = 'finalizada'
            ORDER BY fr.fecha_hora DESC;
        `, [usuario_id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al verificar fotógrafo' });
    }
});

router.post('/calificarFotografo', async (req, res) => {
    const { reserva_id, calificacion, valoracion } = req.body;
    console.log('📥 Calificación de fotógrafo recibida:', { reserva_id, calificacion, valoracion });
    if (!reserva_id || !calificacion ) {
        return res.status(400).json({ error: 'Faltan datos para calificar al fotógrafo' });
    }
    //valoracion is jsonb
    try {
        const result = await pool.query(`
            INSERT INTO fotografo.calificaciones_sesion (id_reserva, calificacion, valoracion)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [reserva_id, calificacion, JSON.stringify(valoracion)]);

        if (result.rows.length > 0) {
            const reserva = result.rows[0];
            emitirReserva(io, reserva.id, reserva);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al calificar fotógrafo' });
    }
});

export default router;
