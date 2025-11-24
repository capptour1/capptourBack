import express from 'express';
import AuthController from './controllers/auth.controller.js';

const router = express.Router();

import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/login', AuthController.login);
router.post('/register/client', AuthController.register_client);
router.post(
    '/register/photographer',
    upload.any(),  
    AuthController.register_photographer
);

export default router;