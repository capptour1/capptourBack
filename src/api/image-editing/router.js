import express from 'express';
import multer from 'multer';
import authMiddleware from '../../middleware/auth.js';
import ImageEditingService from '../../services/image-editing.service.js';
import PhotoRoomAdapter from '../../services/photoroom.adapter.js';
import BriaEraserAdapter from '../../services/bria-erasure.adapter.js';
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

// Instanciar adaptadores y servicios.
// El servicio de edición general usa PhotoRoomAdapter para las operaciones
// existentes (remove_background, transparent_background, etc.).
// El servicio de eliminación de objetos usa BriaEraserAdapter.
const photoRoomAdapter = new PhotoRoomAdapter();
const briaEraserAdapter = new BriaEraserAdapter();

const imageEditingService = new ImageEditingService(photoRoomAdapter);
const briaEraserService = new ImageEditingService(briaEraserAdapter);
const imageEditingController = new ImageEditingController(imageEditingService, briaEraserService);

/**
 * POST /api/image-editing/edit
 * Operación de edición de imágenes para la demo de inversión.
 * Requiere autenticación JWT.
 * Sin PHOTOROOM_API_KEY configurada, las operaciones de PhotoRoom responden 503.
 * Sin BRIA_API_TOKEN configurada, la operación remove_object responde 503.
 */
router.post(
  '/edit',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'backgroundAsset', maxCount: 1 },
    { name: 'mask', maxCount: 1 },
  ]),
  (req, res) => {
    imageEditingController.edit(req, res);
  }
);

export default router;
