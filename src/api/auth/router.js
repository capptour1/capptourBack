import express from 'express';
import multer from 'multer';
import AuthController from './controllers/auth.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', AuthController.login);
router.post('/socialLogin', AuthController.socialLogin);
router.post('/registerClient', AuthController.new_register_client);
router.post('/registerPhotographer', upload.any(), AuthController.new_register_photographer);
router.post('/changePassword', AuthController.changePassword);

export default router;
