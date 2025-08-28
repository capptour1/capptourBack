import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../../../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/fotos_inmediatas/');
    },
    filename: function (req, file, cb) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// POST /api/photos/immediate/upload
router.post('/upload', upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
        }

        const { fotografo_id } = req.body;

        if (!fotografo_id) {
            return res.status(400).json({ message: 'Se requiere el ID del fotógrafo' });
        }

        // URL de la imagen
        const baseUrl = 'https://capptourback-production.up.railway.app';
        const fotoUrl = `${baseUrl}/uploads/fotos_inmediatas/${req.file.filename}`;

        // Guardar en PostgreSQL
        const query = `
      INSERT INTO fotografo.fotos_inmediatas (fotografo_id, usuario_id, foto_url)
      VALUES ($1, $2, $3) 
      RETURNING *
    `;

        const usuario_id = req.user?.userId;

        const result = await db.query(query, [fotografo_id, usuario_id, fotoUrl]);

        res.status(200).json({
            success: true,
            message: 'Foto subida correctamente',
            foto: result.rows[0],
            fotoUrl: fotoUrl
        });
    } catch (err) {
        console.error('❌ Error subiendo foto inmediata:', err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;