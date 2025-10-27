import express from 'express';
import AuthController from './controllers/auth.controller.js';


const router = express.Router();

router.post('/register/client', AuthController.register_client);
router.post('/register/photographer', AuthController.register_photographer);

export default router;