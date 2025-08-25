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
        // 1. Obtener TODOS los fotógrafos (usuarios con rol 5)
        const fotografosResult = await db.query(
            `SELECT 
                u.id AS usuario_id,
                u.nombre_completo,
                f.id AS fotografo_id
             FROM auth.usuarios u
             LEFT JOIN fotografo.fotografos f ON f.usuario_id = u.id
             WHERE u.rol_id = 5
             ORDER BY u.nombre_completo ASC`
        );
        console.log("👥 TODOS los fotógrafos:", fotografosResult.rows);

        // 2. Obtener TODAS las fotos con sus relaciones
        const fotosResult = await db.query(
            `SELECT
                p.id AS photo_id,
                p.file_name,
                p.file_path,
                p.thumbnail,
                p.upload_date,
                p.fotografo_id,
                f.usuario_id,
                u.nombre_completo
             FROM fotografo.photos p
             LEFT JOIN fotografo.fotografos f ON f.id = p.fotografo_id
             LEFT JOIN auth.usuarios u ON u.id = f.usuario_id
             ORDER BY p.upload_date DESC`
        );
        console.log("🖼️ TODAS las fotos:", fotosResult.rows);

        // 3. Crear estructura inicial con TODOS los fotógrafos
        const groupedPhotos = {};

        fotografosResult.rows.forEach((fotografo) => {
            const key = fotografo.fotografo_id || `user_${fotografo.usuario_id}`;
            groupedPhotos[key] = {
                nombreFotografo: fotografo.nombre_completo,
                fotografoId: fotografo.fotografo_id,
                usuarioId: fotografo.usuario_id,
                fotos: []
            };
        });

        // 4. Agregar las fotos a cada fotógrafo correspondiente
        fotosResult.rows.forEach((foto) => {
            if (foto.fotografo_id) {
                const fotografoKey = foto.fotografo_id;

                if (groupedPhotos[fotografoKey]) {
                    groupedPhotos[fotografoKey].fotos.push({
                        id: foto.photo_id,
                        fileName: foto.file_name,
                        filePath: `data:image/jpeg;base64,${foto.file_path}`,
                        thumbnail: `data:image/jpeg;base64,${foto.thumbnail}`,
                        uploadDate: foto.upload_date
                    });
                } else {
                    // Por si hay fotos de fotógrafos que no están en la lista principal
                    console.warn(`⚠️ Foto ${foto.photo_id} pertenece a fotógrafo no listado: ${foto.fotografo_id}`);
                }
            }
        });

        console.log("🎉 ESTRUCTURA FINAL CON TODOS LOS FOTÓGRAFOS:", groupedPhotos);
        res.status(200).json(groupedPhotos);

    } catch (err) {
        console.error('❌ Error al obtener fotógrafos y fotos:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;
