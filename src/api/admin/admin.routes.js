import express from 'express';
import { clases } from './adminController.js';

const router = express.Router();

router.get('/clases', clases);

export default router;