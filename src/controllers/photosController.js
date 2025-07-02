import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadPhoto = async (req, res) => {
    try {
        const { userId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen.' });
        }

        const userResult = await db.query(
            'SELECT rol_id FROM auth.usuarios WHERE id = $1',
            [userId]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const roleId = userResult.rows[0].rol_id;
        if (roleId !== 5) {
            return res.status(403).json({ message: 'Solo fotógrafos pueden subir fotos.' });
        }

        // obtener el id del fotógrafo
        const photographerResult = await db.query(
            'SELECT id FROM fotografo.fotografos WHERE usuario_id = $1',
            [userId]
        );

        // verificar que no se suban mas de 10 fotos por usuario
        const photoCountResult = await db.query(
            'SELECT COUNT(*) FROM fotografo.photos WHERE photographer_id = $1',
            [photographerResult.rows[0].id]
        );

        const photoCount = parseInt(photoCountResult.rows[0].count, 10);
        if (photoCount >= 10) {
            return res.status(403).json({ message: 'Límite de 10 fotos alcanzado.' });
        }


        // Usamos el buffer directamente (no hay archivo en disco)
        const fileBuffer = file.buffer;
        // Cambiar el nombre del archivo para evitar conflictos
        const fileName = Date.now()
        await db.query(
            'INSERT INTO fotografo.photos (photographer_id, file_name, file_path) VALUES ($1, $2, $3)',
            [photographerResult.rows[0].id,
            fileName + path.extname(file.originalname),
            fileBuffer.toString('base64')] // Guardamos el buffer como base64
        );

        res.status(200).json({ message: 'Foto subida correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir la foto.' });
    }
};


export const getPhotosByPhotographer = async (req, res) => {
    try {
        const { userId } = req.body;

        // get id photographer from auth.usuarios
        const userResult = await db.query(
            'SELECT id FROM fotografo.fotografos WHERE usuario_id = $1',
            [userId]
        );

        console.log('Resultado de la consulta de fotógrafo:', userResult.rows);

        if (userResult.rowCount === 0) {
            return res.status(500).json({ message: 'Fotógrafo no encontrado.' });
        }

        const result = await db.query(
            `SELECT id, file_name,  file_path, upload_date 
            FROM fotografo.photos WHERE photographer_id = $1 ORDER BY upload_date DESC`,
            [userResult.rows[0].id]
        );


        if (result.rowCount === 0) {
            return res.status(200).json([])
        }

        const photos = result.rows.map(photo => ({
            id: photo.id,
            fileName: photo.file_name,
            filePath: `data:image/jpeg;base64,${photo.file_path}`,
            uploadDate: photo.upload_date
        }));

        res.status(200).json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las fotos.' });
    }
};
