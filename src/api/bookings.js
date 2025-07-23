import express from 'express';
import pool from '../db.js';

const router = express.Router();

// POST /api/bookings - Crear reserva (Versión mejorada)
router.post('/', async (req, res) => {
    const { fotografo_id, cliente_id, fecha_hora, duracion } = req.body;

    // Validación básica de campos requeridos
    if (!fotografo_id || !cliente_id || !fecha_hora || !duracion) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        // 1. Verificar existencia y estado del fotógrafo
        const fotografo = await pool.query(
            `SELECT id, is_active FROM fotografo.fotografos 
             WHERE id = $1`,
            [fotografo_id]
        );

        if (fotografo.rows.length === 0) {
            return res.status(404).json({ error: 'Fotógrafo no encontrado' });
        }

        if (!fotografo.rows[0].is_active) {
            return res.status(400).json({
                error: 'Fotógrafo no disponible',
                solution: 'Active su perfil en la configuración'
            });
        }

        // 2. Verificar solapamiento de horarios (versión mejorada)
        const solapamiento = await pool.query(
            `SELECT id FROM fotografo.reservas 
             WHERE fotografo_id = $1 
             AND fecha_hora BETWEEN ($2::timestamp - interval '1 minute' * $3) 
                             AND ($2::timestamp + interval '1 minute' * $3)`,
            [fotografo_id, fecha_hora, duracion]
        );

        if (solapamiento.rows.length > 0) {
            return res.status(400).json({
                error: 'Conflicto de horario',
                details: 'Ya existe una reserva que se solapa con este horario'
            });
        }

        // 3. Crear reserva con transacción
        const reserva = await pool.query(
            `INSERT INTO fotografo.reservas 
             (fotografo_id, cliente_id, fecha_hora, duracion, estado)
             VALUES ($1, $2, $3, $4, 'Pendiente')
             RETURNING *`,
            [fotografo_id, cliente_id, fecha_hora, duracion]
        );

        // 4. Actualizar caché si es necesario
        // (Aquí podrías invalidar cachés de calendario si usas)

        res.status(201).json({
            success: true,
            reserva: reserva.rows[0],
            message: 'Reserva creada exitosamente'
        });

    } catch (error) {
        console.error('Error en POST /bookings:', error);
        res.status(500).json({
            error: 'Error al crear reserva',
            details: error.message // Solo en desarrollo, no en producción
        });
    }
});

// GET /api/bookings/clientes - Obtener lista de clientes
router.get('/clientes', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre_completo FROM auth.usuarios WHERE rol_id = 3'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /clientes:', error);
        res.status(500).json([]);
    }
});


// GET /api/bookings?fotografo_id=123&estado=Pendiente&fecha=2023-11-20
router.get('/', async (req, res) => {
    const { fotografo_id, estado, fecha } = req.query;

    try {
        let query = `
            SELECT r.*, u.nombre_completo AS cliente_nombre, u.telefono 
            FROM fotografo.reservas r
            JOIN auth.usuarios u ON r.cliente_id = u.id
            WHERE r.fotografo_id = $1
        `;
        const params = [fotografo_id];

        if (estado && estado !== 'Todas') {
            query += ` AND r.estado = $${params.length + 1}`;
            params.push(estado);
        }

        if (fecha) {
            query += ` AND DATE(r.fecha_hora) = $${params.length + 1}`;
            params.push(fecha);
        }

        query += ' ORDER BY r.fecha_hora DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /bookings:', error);
        res.status(500).json({ error: 'Error al listar reservas' });
    }
});

// PUT /api/bookings/:id - Actualizar reserva
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_hora, duracion, estado } = req.body;

    try {
        const reserva = await pool.query(
            `UPDATE fotografo.reservas 
             SET fecha_hora = $1, duracion = $2, estado = $3
             WHERE id = $4
             RETURNING *`,
            [fecha_hora, duracion, estado, id]
        );
        res.json(reserva.rows[0]);
    } catch (error) {
        console.error('Error en PUT /bookings:', error);
        res.status(500).json({ error: 'Error al actualizar reserva' });
    }
});

// DELETE /api/bookings/:id - Eliminar reserva
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM fotografo.reservas WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error en DELETE /bookings:', error);
        res.status(500).json({ error: 'Error al eliminar reserva' });
    }
});

export default router;