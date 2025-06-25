import express from 'express';
import pool from '../db.js';

const router = express.Router();

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

export default router;
