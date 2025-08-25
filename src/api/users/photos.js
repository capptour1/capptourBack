import express from 'express';
import db from '../../db.js';

const router = express.Router();

// POST /api/users/photos
router.post('/', async (req, res) => {
    const { photographerId } = req.body;

    if (!photographerId) {
        return res.status(400).json({ message: 'Falta photographerId en el cuerpo de la solicitud.' });
    }

    console.log(`📥 Solicitando fotos para el fotógrafo ID: ${photographerId}`);

    try {
        const result = await db.query(
            `SELECT id, file_name, file_path, thumbnail, upload_date
       FROM fotografo.photos
       WHERE photographer_id = $1
       ORDER BY upload_date DESC`,
            [photographerId]
        );

        const photos = result.rows.map((photo) => ({
            id: photo.id,
            fileName: photo.file_name,
            filePath: `data:image/jpeg;base64,${photo.file_path}`,
            thumbnail: `data:image/jpeg;base64,${photo.thumbnail}`,
            uploadDate: photo.upload_date,
        }));

        console.log(`📸 Se encontraron ${photos.length} fotos`);
        res.status(200).json(photos);
    } catch (err) {
        console.error('❌ Error al obtener fotos:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// POST /api/users/photos/all
router.post('/all', async (req, res) => {
    console.log('📢 Petición recibida en /all');

    try {
        // 1. PRIMERO: Debuggear TODOS los usuarios con rol 5
        const usuariosResult = await db.query(
            `SELECT 
                u.id AS usuario_id,
                u.nombre_completo,
                u.rol_id
             FROM auth.usuarios u
             WHERE u.rol_id = 5
             ORDER BY u.nombre_completo ASC`
        );
        console.log("👥 TODOS los usuarios con rol 5:", usuariosResult.rows);

        // 2. Debuggear TODOS los fotografos
        const fotografosResult = await db.query(
            `SELECT 
                f.id AS fotografo_id,
                f.usuario_id,
                u.nombre_completo
             FROM fotografo.fotografos f
             LEFT JOIN auth.usuarios u ON u.id = f.usuario_id
             ORDER BY u.nombre_completo ASC`
        );
        console.log("📸 TODOS los fotografos:", fotografosResult.rows);

        // 3. Debuggear TODAS las fotos con SUS fotografo_id
        const fotosResult = await db.query(
            `SELECT
                p.id AS photo_id,
                p.file_name,
                p.fotografo_id,
                f.usuario_id,
                u.nombre_completo
             FROM fotografo.photos p
             LEFT JOIN fotografo.fotografos f ON f.id = p.fotografo_id
             LEFT JOIN auth.usuarios u ON u.id = f.usuario_id
             ORDER BY p.upload_date DESC`
        );
        console.log("🖼️ TODAS las fotos con sus relaciones:", fotosResult.rows);

        // 4. CONSULTA FINAL CORREGIDA (la que debería funcionar)
        const result = await db.query(
            `SELECT
                p.id AS photo_id,
                p.file_name,
                p.file_path,
                p.thumbnail,
                p.upload_date,
                u.nombre_completo AS nombre_fotografo,
                f.id AS fotografo_id,
                u.id AS usuario_id
             FROM fotografo.photos p
             INNER JOIN fotografo.fotografos f ON f.id = p.fotografo_id
             INNER JOIN auth.usuarios u ON u.id = f.usuario_id
             WHERE u.rol_id = 5
             ORDER BY u.nombre_completo ASC, p.upload_date DESC`
        );

        console.log("✅ Resultado de la consulta final:", result.rows);

        if (result.rows.length === 0) {
            console.log("No hay fotos disponibles");

            // Pero aún así devolvemos todos los fotógrafos
            const todosFotografos = await db.query(
                `SELECT 
                    u.id AS usuario_id,
                    u.nombre_completo AS nombre_fotografo,
                    f.id AS fotografo_id
                 FROM auth.usuarios u
                 LEFT JOIN fotografo.fotografos f ON f.usuario_id = u.id
                 WHERE u.rol_id = 5
                 ORDER BY u.nombre_completo ASC`
            );

            const groupedPhotos = {};
            todosFotografos.rows.forEach((fotografo) => {
                const key = fotografo.fotografo_id || `user_${fotografo.usuario_id}`;
                groupedPhotos[key] = {
                    nombreFotografo: fotografo.nombre_fotografo,
                    fotos: []
                };
            });

            return res.status(200).json(groupedPhotos);
        }

        const groupedPhotos = {};

        result.rows.forEach((row) => {
            const fotografoId = row.fotografo_id;

            if (!groupedPhotos[fotografoId]) {
                groupedPhotos[fotografoId] = {
                    nombreFotografo: row.nombre_fotografo,
                    fotos: []
                };
            }

            groupedPhotos[fotografoId].fotos.push({
                id: row.photo_id,
                fileName: row.file_name,
                filePath: `data:image/jpeg;base64,${row.file_path}`,
                thumbnail: `data:image/jpeg;base64,${row.thumbnail}`,
                uploadDate: row.upload_date
            });
        });

        console.log("🎉 FOTOS AGRUPADAS CORRECTAMENTE:", groupedPhotos);
        res.status(200).json(groupedPhotos);

    } catch (err) {
        console.error('❌ Error al obtener fotógrafos y fotos:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;
