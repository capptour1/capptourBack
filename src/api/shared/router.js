import express from 'express';
import SharedController from './controllers/shared.controller.js';

const router = express.Router();


router.post('/getCurrencies', SharedController.getCurrencies);
router.post('/getCategories', SharedController.getCategories);
router.post('/getRoles', SharedController.getRoles);

router.post('/getCountries', SharedController.getCountries);
router.post('/getGenders', SharedController.getGenders);

export default router;
