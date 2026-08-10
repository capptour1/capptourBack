import express from 'express';
import SharedController from './controllers/shared.controller.js';

const router = express.Router();


router.post('/getCurrencies', SharedController.getCurrencies);
router.post('/getCategories', SharedController.getCategories);

export default router;
