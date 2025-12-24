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
router.post('/getImagesPortfolio', photographerController.getImagesPortfolio);
router.post('/deleteImage', photographerController.deleteImage);
router.post('/uploadImagePortfolio',  upload.any(), photographerController.uploadImagePortfolio);

router.post('/getServices', photographerController.getServices);
router.post('/addService', photographerController.addService);
router.post('/deleteService', photographerController.deleteService);


router.post('/bookings', pBookingController.getBookings);
router.post('/approveBooking', pBookingController.approveBooking);
router.post('/submitDelivery', upload.any(), pBookingController.submitDelivery);


router.post('/photoHistory', pBookingController.get_history);


export default router;