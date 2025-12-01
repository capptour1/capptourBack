import express from 'express';
import photographerController from './controllers/photographer.controller.js';

const router = express.Router();

import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/profile', photographerController.getPhotographerById);
router.post('/updateBio', photographerController.updateBio);
router.post('/updateProfile', photographerController.updateProfile);

router.post('/toggleStatus', photographerController.toggleStatus);
router.post('/getStatus', photographerController.getStatus);


export default router;