import express from 'express';
import path from 'path';
import multer from 'multer';
import pool from '../../db.js';

const router = express.Router();

/* ================================
   Configuración de Multer
================================ */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/comprobantes'); // carpeta donde se guardan los comprobantes
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `comprobante_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

/* ================================
   1. Crear pago
================================ */
router.post('/', async (req, res) => {
    try {
        const { sesion_fotos_id, reserva_id, cliente_id, fotografo_id, metodo_pago, observaciones, comprobante_url } = req.body;

        const calcQuery = `
          SELECT SUM((tarifa->>'precio')::NUMERIC * (tarifa->>'cantidad_fotos')::NUMERIC) AS total
          FROM fotografo.sesion_fotos
          CROSS JOIN LATERAL jsonb_array_elements(tarifas) tarifa
          WHERE id = $1;
        `;
        const { rows: totalRows } = await pool.query(calcQuery, [sesion_fotos_id]);
        const monto_total = totalRows[0]?.total || 0;

        const query = `
          INSERT INTO fotografo.pagos
          (sesion_fotos_id, reserva_id, cliente_id, fotografo_id, metodo_pago, monto_total, observaciones, comprobante_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const values = [sesion_fotos_id, reserva_id, cliente_id, fotografo_id, metodo_pago, monto_total, observaciones, comprobante_url];
        const { rows } = await pool.query(query, values);

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creando pago:', error);
        res.status(500).json({ error: 'Error creando pago' });
    }
});

/* ================================
   2. Obtener pago por ID
================================ */
router.get('/:id', async (req, res) => {
    try {
        const query = `
          SELECT p.*, 
                 sf.nombre AS nombre_sesion,
                 sf.descripcion AS descripcion_sesion,
                 u1.nombre_completo AS nombre_cliente,
                 u2.nombre_completo AS nombre_fotografo
          FROM fotografo.pagos p
          JOIN fotografo.sesion_fotos sf ON p.sesion_fotos_id = sf.id
          JOIN auth.usuarios u1 ON p.cliente_id = u1.id
          JOIN auth.usuarios u2 ON p.fotografo_id = u2.id
          WHERE p.id = $1;
        `;
        const { rows } = await pool.query(query, [req.params.id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo pago:', error);
        res.status(500).json({ error: 'Error obteniendo pago' });
    }
});

/* ================================
   3. Confirmar pago
================================ */
router.put('/:id/confirmar', async (req, res) => {
    try {
        const query = `
            UPDATE fotografo.pagos
            SET estado_pago = 'confirmado',
                fecha_pago = CURRENT_TIMESTAMP,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.status(200).json({
            message: 'Pago confirmado con éxito',
            pago: rows[0]
        });
    } catch (error) {
        console.error('Error confirmando pago:', error);
        res.status(500).json({ error: 'Error confirmando pago' });
    }
});

/* ================================
   4. Rechazar pago
================================ */
router.put('/:id/rechazar', async (req, res) => {
    try {
        const query = `
          UPDATE fotografo.pagos
          SET estado_pago = 'rechazado', fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *;
        `;
        const { rows } = await pool.query(query, [req.params.id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error rechazando pago:', error);
        res.status(500).json({ error: 'Error rechazando pago' });
    }
});

/* ================================
   5. Listar pagos por fotógrafo
================================ */
router.get('/fotografo/:fotografoId', async (req, res) => {
    try {
        const query = `
          SELECT p.*, 
                 sf.nombre AS nombre_sesion,
                 sf.descripcion AS descripcion_sesion,
                 u1.nombre_completo AS nombre_cliente
          FROM fotografo.pagos p
          JOIN fotografo.sesion_fotos sf ON p.sesion_fotos_id = sf.id
          JOIN auth.usuarios u1 ON p.cliente_id = u1.id
          WHERE p.fotografo_id = $1
          ORDER BY p.fecha_creacion DESC;
        `;
        const { rows } = await pool.query(query, [req.params.fotografoId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error listando pagos del fotógrafo:', error);
        res.status(500).json({ error: 'Error listando pagos' });
    }
});

/* ================================
   6. Subida de comprobante
================================ */
router.post('/:id/comprobante', upload.single('comprobante'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }
        const comprobanteUrl = `/uploads/comprobantes/${req.file.filename}`;
        const query = `
          UPDATE fotografo.pagos
          SET comprobante_url = $1, fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *;
        `;
        const { rows } = await pool.query(query, [comprobanteUrl, req.params.id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error subiendo comprobante:', error);
        res.status(500).json({ error: 'Error subiendo comprobante' });
    }
});

/* ================================
   7. Listar pagos por cliente
================================ */
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const query = `
      SELECT p.*, 
             sf.nombre AS nombre_sesion,
             sf.descripcion AS descripcion_sesion,
             u1.nombre_completo AS nombre_fotografo
      FROM fotografo.pagos p
      JOIN fotografo.sesion_fotos sf ON p.sesion_fotos_id = sf.id
      JOIN auth.usuarios u1 ON p.fotografo_id = u1.id
      WHERE p.cliente_id = $1
      ORDER BY p.fecha_creacion DESC;
    `;
        const { rows } = await pool.query(query, [req.params.clienteId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error listando pagos del cliente:', error);
        res.status(500).json({ error: 'Error listando pagos del cliente' });
    }
});

/* ================================
   8. Crear pago manual (fotógrafo)
================================ */
router.post('/manual', async (req, res) => {
    try {
        const { sesion_fotos_id, reserva_id, cliente_id, fotografo_id, metodo_pago, monto_total, observaciones, comprobante_url } = req.body;
        const query = `
      INSERT INTO fotografo.pagos
      (sesion_fotos_id, reserva_id, cliente_id, fotografo_id, metodo_pago, monto_total, observaciones, comprobante_url, estado_pago)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente')
      RETURNING *;
    `;
        const { rows } = await pool.query(query, [
            sesion_fotos_id,
            reserva_id,
            cliente_id,
            fotografo_id,
            metodo_pago,
            monto_total,
            observaciones,
            comprobante_url
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creando pago manual:', error);
        res.status(500).json({ error: 'Error creando pago manual' });
    }
});

/* ================================
   9. Actualizar método de pago + comprobante
================================ */
router.put('/:id/metodo', upload.single('comprobante'), async (req, res) => {
    try {
        const { metodo_pago } = req.body;
        const comprobanteUrl = req.file
            ? `/uploads/comprobantes/${req.file.filename}`
            : null;

        const query = `
            UPDATE fotografo.pagos
            SET metodo_pago = $1,
                comprobante_url = COALESCE($2, comprobante_url),
                estado_pago = 'en_revision',
                fecha_pago = CURRENT_TIMESTAMP,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *;
        `;

        const values = [
            metodo_pago,
            comprobanteUrl,
            req.params.id
        ];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.status(200).json({
            message: 'Método de pago y comprobante actualizados con éxito',
            pago: rows[0]
        });
    } catch (error) {
        console.error('Error actualizando método de pago:', error);
        res.status(500).json({ error: 'Error actualizando método de pago' });
    }
});

export default router;
