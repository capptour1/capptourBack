import express from 'express';
import pool from '../db.js';

const router = express.Router();

// POST /api/bookings - Crear reserva
// POST /api/bookings - Crear reserva (Versión Final)
router.post('/', async (req, res) => {
    const { fotografo_id, cliente_id, fecha_hora, duracion } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar existencia del fotógrafo (por usuario_id)
        const fotografo = await client.query(
            `SELECT usuario_id FROM fotografo.fotografos 
             WHERE usuario_id = $1 FOR UPDATE`,
            [fotografo_id]
        );

        if (fotografo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Fotógrafo no existe',
                detalle: `No se encontró usuario_id=${fotografo_id} en fotografos`
            });
        }

        // 2. Verificar existencia del cliente
        const cliente = await client.query(
            `SELECT id FROM auth.usuarios WHERE id = $1 FOR UPDATE`,
            [cliente_id]
        );

        if (cliente.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Cliente no existe',
                detalle: `No se encontró id=${cliente_id} en usuarios`
            });
        }

        // 3. Insertar reserva
        const result = await client.query(
            `INSERT INTO fotografo.reservas 
             (fotografo_id, cliente_id, fecha_hora, duracion, estado)
             VALUES ($1, $2, $3, $4, 'pendiente') RETURNING *`,
            [fotografo_id, cliente_id, fecha_hora, duracion]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23503') { // Violación FK
            res.status(400).json({
                error: 'Error de referencia',
                solucion: 'Verifica que el fotógrafo y cliente existan',
                datos: { fotografo_id, cliente_id }
            });
        } else {
            console.error('Error:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    } finally {
        client.release();
    }
});


// 👇 Helper para obtener fotógrafos disponibles
async function getFotografosDisponibles(client) {
    const result = await client.query(
        `SELECT id, usuario_id FROM fotografo.fotografos WHERE is_active = true`
    );
    return result.rows;
}

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

router.post('/cancelarInmediatasUsuario', async (req, res) => {
    const { usuario_id } = req.body;

    console.log('📥 POST /cancelarInmediatasUsuario recibido');
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

export default router;