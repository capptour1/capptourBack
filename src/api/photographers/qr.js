import express from 'express';
import db from '../../db.js';
import QRCode from 'qrcode';

const router = express.Router();

// POST /api/photographers/qr/generate - Solo para fotógrafos (rol_id = 5)
router.post('/generate', async (req, res) => {
    try {
        // Verificar que el usuario es fotógrafo (desde el middleware global)
        if (req.user.role !== '5') {
            return res.status(403).json({ error: 'Acceso denegado. Solo fotógrafos pueden generar QR' });
        }

        const usuarioId = req.user.userId;

        // Obtener datos del fotógrafo
        const query = `
      SELECT f.id, f.nombre, f.foto_perfil, u.email 
      FROM fotografo.fotografos f
      INNER JOIN auth.usuarios u ON f.usuario_id = u.id
      WHERE f.usuario_id = $1
    `;

        const result = await db.query(query, [usuarioId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Fotógrafo no encontrado' });
        }

        const fotografo = result.rows[0];

        // Datos para incluir en el QR
        const qrData = JSON.stringify({
            fotografo_id: fotografo.id,
            action: 'foto_inmediata',
            timestamp: new Date().getTime()
        });

        // Generar QR como Data URL (imagen base64)
        const qrImage = await QRCode.toDataURL(qrData);

        res.status(200).json({
            qr: qrImage,
            fotografo: {
                id: fotografo.id,
                nombre: fotografo.nombre,
                foto_perfil: fotografo.foto_perfil,
                email: fotografo.email
            }
        });
    } catch (err) {
        console.error('❌ Error generando QR:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;