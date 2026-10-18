import express from 'express';
import multer from 'multer';
import authMiddleware from '../../middleware/auth.js';
import ImageEditingService from '../../services/image-editing.service.js';
import PhotoRoomAdapter from '../../services/photoroom.adapter.js';
import ImageEditingController from './controllers/image-editing.controller.js';

const router = express.Router();

// Límites razonables: 10 MB por archivo y solo tipos de imagen permitidos.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido: ' + file.mimetype));
    }
    cb(null, true);
  },
});

// Instanciar adaptador y servicio. El servicio verifica internamente
// si PHOTOROOM_API_KEY está configurada; si no, está no disponible.
const photoRoomAdapter = new PhotoRoomAdapter();
const imageEditingService = new ImageEditingService(photoRoomAdapter);
const imageEditingController = new ImageEditingController(imageEditingService);

/**
 * POST /api/image-editing/edit
 * Operación de edición de imágenes para la demo de inversión.
 * Requiere autenticación JWT.
 * Sin PHOTOROOM_API_KEY configurada, responde 503 IMAGE_EDITING_UNAVAILABLE.
 */
router.post(
  '/edit',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'backgroundAsset', maxCount: 1 },
  ]),
  (req, res) => {
    imageEditingController.edit(req, res);
  }
);

export default router;
