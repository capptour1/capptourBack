import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// 👉 Log inicial para confirmar que el archivo de rutas se está cargando
console.log('📦 Archivo de rutas de ubicación cargado correctamente');

// 👉 Ruta para guardar o actualizar la ubicación del fotógrafo
router.post('/fotografo', async (req, res) => {
    console.log('📥 POST /fotografo recibido');
    console.log('📦 Body recibido:', req.body);

    const { userId, latitude, longitude } = req.body;

    if (!userId || !latitude || !longitude) {
        console.warn('⚠️ Datos incompletos en /fotografo');
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    try {
        console.log(`📝 Guardando/actualizando ubicación para userId: ${userId}`);
        await pool.query(`
            INSERT INTO auth.ubicaciones_activas (usuario_id, latitude, longitude, actualizada_en)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (usuario_id)
            DO UPDATE SET latitude = $2, longitude = $3, actualizada_en = NOW()
        `, [userId, latitude, longitude]);

        console.log('✅ Ubicación guardada/actualizada correctamente');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error al guardar ubicación en BD:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 👉 Ruta para obtener fotógrafos cercanos
router.post('/cercanos', async (req, res) => {
    console.log('📥 POST /cercanos recibido');
    console.log('📦 Body recibido:', req.body);

    const { userLat, userLng, radiusKm } = req.body;

    if (!userLat || !userLng || !radiusKm) {
        console.warn('⚠️ Datos incompletos en /cercanos');
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    try {
        console.log(`🔎 Buscando fotógrafos cerca de (${userLat}, ${userLng}) en un radio de ${radiusKm} km`);
        const result = await pool.query(`
            SELECT ua.usuario_id, u.nombre_completo, ua.latitude, ua.longitude, ua.actualizada_en
            FROM auth.ubicaciones_activas ua
            JOIN auth.usuarios u ON ua.usuario_id = u.id
            WHERE u.rol_id = 5 AND
            ua.actualizada_en > NOW() - INTERVAL '2 minutes' 
            ORDER BY ua.actualizada_en DESC
        `);

        const haversine = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const toRad = deg => deg * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const cercanos = result.rows.filter(f => {
            const distancia = haversine(userLat, userLng, f.latitude, f.longitude);
            return distancia <= radiusKm;
        });


        console.log(`📸 Fotógrafos encontrados: ${cercanos.length}`);
        res.json(cercanos);
    } catch (error) {
        console.error('❌ Error al buscar fotógrafos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
