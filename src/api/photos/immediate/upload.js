import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../../../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

//  Configurar multer para almacenamiento TEMPORAL
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Usar carpeta temporal del sistema
        cb(null, '/tmp/uploads/');
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

// ✅ POST /api/photos/immediate/upload
router.post('/upload', upload.single('foto'), async (req, res) => {
    try {
        console.log('📤 Iniciando upload de foto...');

        if (!req.file) {
            console.log('❌ No se recibió archivo');
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ninguna imagen'
            });
        }

        const { fotografo_id } = req.body;

        if (!fotografo_id) {
            console.log('❌ Falta fotografo_id');
            return res.status(400).json({
                success: false,
                message: 'Se requiere el ID del fotógrafo'
            });
        }

        console.log('✅ Archivo recibido:', req.file.filename);

        // ✅ SIMULAR URL DE IMAGEN (solución temporal)
        const fotoUrl = `https://via.placeholder.com/600x400/3F1D8C/FFFFFF?text=Foto+${fotografo_id}`;
        console.log('🌐 URL temporal:', fotoUrl);

        // ✅ Guardar en PostgreSQL (solo la referencia)
        const query = `
      INSERT INTO fotografo.fotos_inmediatas (fotografo_id, usuario_id, foto_url)
      VALUES ($1, $2, $3) 
      RETURNING *
    `;

        const usuario_id = req.user?.userId;
        console.log('👤 Usuario ID:', usuario_id);

        const result = await db.query(query, [fotografo_id, usuario_id, fotoUrl]);
        console.log('💾 Foto guardada en BD:', result.rows[0]);

        // ✅ Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Foto procesada correctamente (modo simulación)',
            foto: result.rows[0],
            fotoUrl: fotoUrl
        });

    } catch (err) {
        console.error('❌ Error subiendo foto inmediata:', err.stack);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ✅ Endpoint de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de upload funciona correctamente',
        timestamp: new Date().toISOString(),
        mode: 'simulación'
    });
});

export default router;