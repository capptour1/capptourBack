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

export default router;
