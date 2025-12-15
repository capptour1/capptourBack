import express from 'express';
import mapController from './controllers/map.controller.js';
import userController from './controllers/user.controller.js';

const router = express.Router();


router.post('/profile', userController.get_user_by_id);
router.post('/nearby-photographers', mapController.getNearbyPhotographers);

export default router;