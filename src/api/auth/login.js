import jwt from 'jsonwebtoken';
import express from 'express';
import pool from '../../db.js';

const SECRET_KEY = 'secret_key';

const router = express.Router();





router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM auth.usuarios WHERE email = $1', [email]);
        const user = result.rows[0];

        
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.rol_id },
            SECRET_KEY,
            { expiresIn: '2h' }
        );


        res.status(200).json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre_completo,
                email: user.email,
                rol_id: user.rol_id,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


export default router;
