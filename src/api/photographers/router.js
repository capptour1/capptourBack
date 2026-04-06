import express from 'express';
import photographerController from './controllers/photographer.controller.js';
import pBookingController from './controllers/p_booking.controller.js';

const router = express.Router();

import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});



// NUEVO CONTROLADOR PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL
router.post('/getInfoPhotoDbById', photographerController.getInfoPhotoDbById);
router.post('/changeAvailability', photographerController.changeAvailability);
router.post('/changeStatusServiceRequest', photographerController.changeStatusSession);
router.post('/getAllSessionsByPhotographer', photographerController.getAllSessionsByPhotographer);
router.post('/uploadImagesDelivery', upload.any(), photographerController.uploadImagesDelivery);
router.post('/uploadLinksDelivery', photographerController.uploadLinksDelivery);
router.post('/uploadImageDelivery', upload.any(), photographerController.uploadImageDelivery);
router.post('/deleteImageDelivery', photographerController.deleteImageDelivery);
router.post('/getServices', photographerController.getServices);

export default router;