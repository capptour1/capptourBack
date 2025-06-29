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

        // Usamos el buffer directamente (no hay archivo en disco)
        const fileBuffer = file.buffer;

        await db.query(
            'INSERT INTO fotografo.photos (photographer_id, file_name, file_path) VALUES ($1, $2, $3)',
            [userId, file.originalname, fileBuffer]
        );

        res.status(200).json({ message: 'Foto subida correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir la foto.' });
    }
};


export const getPhotosByPhotographer = async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await db.query(
            'SELECT id, file_name, file_path, upload_date FROM fotografo.photos WHERE photographer_id = $1 ORDER BY upload_date DESC',
            [userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las fotos.' });
    }
};
