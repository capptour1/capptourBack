import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import fs from 'fs/promises';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log('Archivo recibido:', file.originalname);
        // Validar que el archivo sea un PDF
        console.log('Tipo de archivo:', file.mimetype);
        const allowedTypes = ['application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no permitido (solo PDF).'));
        }
    },
});

router.post('/', async (req, res) => {
    const { nombre, email, password, rol_id, telefono } = req.body;

    if (!nombre || !email || !password || !rol_id || !telefono) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const insertQuery = `
          INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id, telefono, creado_en)
          VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;
        `;

        const values = [nombre, email, password, rol_id, telefono];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Usuario registrado', usuario: result.rows[0] });
        console.log('Usuario registrado:', result.rows[0]);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/register/fotografo', upload.single('hoja_vida'), async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nombre, email, password, rol_id, telefono,
            descripcion, tarifas
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No se adjuntó hoja de vida' });
        }

        // Iniciar transacción
        await client.query('BEGIN');

        // 1. Insertar en usuarios
        const userResult = await client.query(
            `INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id, telefono, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
            [nombre, email, password, rol_id, telefono]
        );

        const usuario_id = userResult.rows[0].id;

        // 2. Insertar en fotógrafos
        await client.query(
            `INSERT INTO fotografo.fotografos (usuario_id, hoja_vida, descripcion, tarifas)
       VALUES ($1, $2, $3, $4)`,
            [usuario_id, req.file.originalname, descripcion, tarifas]
        );

        // Confirmar transacción
        await client.query('COMMIT');

        res.status(201).json({ message: 'Fotógrafo registrado con éxito' });

    } catch (error) {
        // Revertir transacción
        await client.query('ROLLBACK');
        console.error('Error en registro de fotógrafo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });

    } finally {
        client.release();
    }
});


router.post('/info', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Falta el ID del usuario' });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.nombre_completo, u.email, u.telefono, u.rol_id,
                    f.descripcion, f.tarifas, f.hoja_vida
             FROM auth.usuarios u
             LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


export default router;
