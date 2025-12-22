import express from 'express';
import photographerController from './controllers/photographer.controller.js';
import pBookingController from './controllers/p_booking.controller.js';

const router = express.Router();

import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/profile', photographerController.getPhotographerById);
router.post('/updateBio', photographerController.updateBio);
router.post('/updateProfile', photographerController.updateProfile);
router.post('/setAvailability', photographerController.toggleStatus);


router.post('/bookings', pBookingController.getBookings);
router.post('/approveBooking', pBookingController.approveBooking);
router.post('/submitDelivery', upload.any(), pBookingController.submitDelivery);


export default router;