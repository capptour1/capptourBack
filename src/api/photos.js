import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadPhoto, getPhotosByPhotographer, deletePhoto, getPhotoById} from '../controllers/photosController.js';
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

const upload = multer({
    storage: multer.memoryStorage(),
    //limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Solo se permiten imágenes JPEG o PNG.'));
    },
});

// Endpoints
router.post('/upload', upload.single('photo'), uploadPhoto);
router.post('/byUser', getPhotosByPhotographer);
router.post('/deletePhoto', deletePhoto);
router.post('/getPhotoById', getPhotoById);

export default router;
