import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadPhoto, getPhotosByPhotographer } from '../controllers/photosController.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de Multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(process.cwd(), 'uploads'));
//     },
//     filename: (req, file, cb) => {
//         const uniqueName = Date.now() + '-' + file.originalname;
//         cb(null, uniqueName);
//     },
// });
const storage = multer.memoryStorage();//usamos memoria para evitar guardar archivos en disco y los trabajamos como buffers
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no permitido (solo PNG y JPG).'));
        }
    },
});

// Endpoints
router.post('/upload', upload.single('photo'), uploadPhoto);
router.post('/byUser', getPhotosByPhotographer);

export default router;
