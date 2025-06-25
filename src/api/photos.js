import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadPhoto, getPhotosByPhotographer } from '../controllers/photosController.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        console.log('Mimetype recibido:', file.mimetype);  // 👉 Ayuda a depurar
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no permitido (solo PNG y JPG).'));
        }
    },
});

// Endpoints
router.post('/upload', upload.single('photo'), uploadPhoto);
router.get('/byUser/:userId', getPhotosByPhotographer);

export default router;
