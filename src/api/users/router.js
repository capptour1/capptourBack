import express from 'express';
import mapController from './controllers/map.controller.js';
import userController from './controllers/user.controller.js';
import bookingController from './controllers/booking.controller.js';

const router = express.Router();


router.post('/profile', userController.get_user_by_id);
router.post('/nearby-photographers', mapController.getNearbyPhotographers);
router.post('/gallery-photographer', mapController.get_gallery_photographer);
router.post('/services-photographer', mapController.get_services_photographer);
router.post('/submit-booking', bookingController.submit_booking);

export default router;