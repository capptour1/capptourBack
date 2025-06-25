import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM auth.roles');
        console.log('Roles obtenidos:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo roles:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
});

export default router;
