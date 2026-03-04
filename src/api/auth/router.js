import express from 'express';
import AuthController from './controllers/auth.controller.js';

const router = express.Router();

import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/login', AuthController.login);
// NUEVAS RUTAS
router.post('/registerClient', AuthController.new_register_client);
router.post('/registerPhotographer', upload.any(), AuthController.new_register_photographer);




export default router;