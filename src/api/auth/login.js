import express from 'express';
import pool from '../../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Faltan campos' });
    }

    try {
        const result = await pool.query(
            `SELECT nombre_completo, rol_id 
       FROM auth.usuarios 
       WHERE email = $1 AND password = $2
       LIMIT 1`,
            [email, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        res.json({
            nombre: user.nombre_completo,
            rol_id: user.rol_id  // ✅ Solo mandamos el ID numérico
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
