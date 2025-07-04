import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db.js';

import sharp from 'sharp';

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

        // Obtener ID del fotógrafo
        const photographerResult = await db.query(
            'SELECT id FROM fotografo.fotografos WHERE usuario_id = $1',
            [userId]
        );
        const photographerId = photographerResult.rows[0]?.id;

        if (!photographerId) {
            return res.status(404).json({ message: 'Fotógrafo no encontrado.' });
        }

        // Validar límite de fotos
        const photoCountResult = await db.query(
            'SELECT COUNT(*) FROM fotografo.photos WHERE photographer_id = $1',
            [photographerId]
        );
        const photoCount = parseInt(photoCountResult.rows[0].count, 10);
        if (photoCount >= 10) {
            return res.status(403).json({ message: 'Límite de 10 fotos alcanzado.' });
        }

        const fileBuffer = file.buffer;

        // Generar thumbnail pequeño (por ejemplo 200px ancho)
        const thumbnailBuffer = await sharp(fileBuffer)
            .resize(200)
            .jpeg({ quality: 60 }) // comprimir el thumbnail
            .toBuffer();

        // Generar nombre archivo único
        const fileName = Date.now() + path.extname(file.originalname);

        await db.query(
            'INSERT INTO fotografo.photos (photographer_id, file_name, file_path, thumbnail) VALUES ($1, $2, $3, $4)',
            [
                photographerId,
                fileName,
                fileBuffer.toString('base64'),      // imagen completa
                thumbnailBuffer.toString('base64'), // thumbnail
            ]
        );

        res.status(200).json({ message: 'Foto y thumbnail subidos correctamente.' });
    } catch (error) {
        console.error('Error al subir foto con thumbnail:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
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
            `SELECT id, file_name, thumbnail, upload_date
            FROM fotografo.photos WHERE photographer_id = $1 ORDER BY upload_date DESC`,
            [userResult.rows[0].id]
        );


        if (result.rowCount === 0) {
            return res.status(200).json([])
        }

        const photos = result.rows.map(photo => ({
            id: photo.id,
            fileName: photo.file_name,
            thumbnail: `data:image/jpeg;base64,${photo.thumbnail}`,
            uploadDate: photo.upload_date
        }));

        res.status(200).json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las fotos.' });
    }
};


export const deletePhoto = async (req, res) => {
    try {
        const { photoId, userId } = req.body;

        // Verificar si el usuario es fotógrafo
        const userResult = await db.query(
            'SELECT rol_id FROM auth.usuarios WHERE id = $1',
            [userId]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const roleId = userResult.rows[0].rol_id;
        if (roleId !== 5) {
            return res.status(403).json({ message: 'Solo fotógrafos pueden eliminar fotos.' });
        }

        // Verificar si la foto existe y pertenece al fotógrafo
        const photoResult = await db.query(
            'SELECT id FROM fotografo.photos WHERE id = $1 AND photographer_id = (SELECT id FROM fotografo.fotografos WHERE usuario_id = $2)',
            [photoId, userId]
        );

        if (photoResult.rowCount === 0) {
            return res.status(404).json({ message: 'Foto no encontrada o no pertenece al fotógrafo.' });
        }

        // Eliminar la foto
        await db.query('DELETE FROM fotografo.photos WHERE id = $1', [photoId]);

        res.status(200).json({ message: 'Foto eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar foto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

export const getPhotoById = async (req, res) => {
    console.log('getPhotoById called with params:', req.body);
    try {
        const { photoId } = req.body;

        // Verificar si la foto existe
        const photoResult = await db.query(
            'SELECT id, file_name, file_path FROM fotografo.photos WHERE id = $1',
            [photoId]
        );

        if (photoResult.rowCount === 0) {
            return res.status(404).json({ message: 'Foto no encontrada.' });
        }

        const photo = photoResult.rows[0];
        console.log('Foto encontrada:', photo);
        res.status(200).json({
            id: photo.id,
            fileName: photo.file_name,
            filePath: `data:image/jpeg;base64,${photo.file_path}`
        });
    } catch (error) {
        console.error('Error al obtener foto por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};