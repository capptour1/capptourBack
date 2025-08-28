import express from 'express';
import db from '../../db.js';
import QRCode from 'qrcode';

const router = express.Router();

// POST /api/photographers/qr/generate - Solo para fotógrafos (role = 5)
router.post('/generate', async (req, res) => {
    try {
        // ✅ VERIFICACIÓN DE USUARIO AUTENTICADO
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // ✅ VERIFICACIÓN DE ROL CORREGIDA (usar 'role' en lugar de 'rol_id')
        if (req.user.role !== '5') {
            console.log('🚫 Acceso denegado. Rol recibido:', req.user.role);
            return res.status(403).json({ error: 'Acceso denegado. Solo fotógrafos pueden generar QR' });
        }

        const usuarioId = req.user.userId;
        console.log('📸 Generando QR para usuario_id:', usuarioId);

        // Obtener datos del fotógrafo
        const query = `
            SELECT f.id, f.nombre, f.foto_perfil, u.email 
            FROM fotografo.fotografos f
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            WHERE f.usuario_id = $1
        `;

        const result = await db.query(query, [usuarioId]);

        if (result.rows.length === 0) {
            console.log('❌ Fotógrafo no encontrado para usuario_id:', usuarioId);
            return res.status(404).json({ message: 'Fotógrafo no encontrado' });
        }

        const fotografo = result.rows[0];
        console.log('✅ Fotógrafo encontrado:', fotografo);

        // Datos para incluir en el QR
        const qrData = JSON.stringify({
            fotografo_id: fotografo.id,
            action: 'foto_inmediata',
            timestamp: new Date().getTime()
        });

        // Generar QR como Data URL (imagen base64)
        const qrImage = await QRCode.toDataURL(qrData);

        console.log('✅ QR generado exitosamente para fotógrafo ID:', fotografo.id);

        res.status(200).json({
            success: true,
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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});

export default router;