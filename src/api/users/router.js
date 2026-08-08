import express from 'express';
import mapController from './controllers/map.controller.js';
import userController from './controllers/user.controller.js';
import bookingController from './controllers/booking.controller.js';
import explorerController from './controllers/explorer.controller.js';

const router = express.Router();


import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

// NEW ROUTES
router.post('/searchPhotographers', mapController.searchPhotographers);
router.post('/get-monedas', userController.get_monedas);
router.post('/getInfoPhotographer', userController.getInfoPhotoById);
router.post('/get-services-gallery-photographer', userController.getServicesGalleryByPhotographerId);
router.post('/getServicePhotographer', userController.getServicesByPhotographerId);
router.post('/add-service-request', userController.addServiceRequest);
router.post('/createInstantSession', userController.createInstantSession);


router.post('/getCountries', userController.getCountries);
router.post('/getGenders', userController.getGenders);

router.post('/getInfoUserById', userController.getInfoUserById);
router.post('/updateProfilePicture', upload.any(), userController.updateProfilePicture);
router.post('/updateProfile', userController.updateProfile);


router.post('/getBookingsByUserId', bookingController.getBookingsByUserId);

router.post('/getExplorerImages', explorerController.getExplorerImages);
router.post('/getFullImage', explorerController.getFullImage);
router.post('/submitServiceRating', userController.submitServiceRating);
router.post('/getFullImagesByBookingId', userController.getFullImagesByBookingId);
router.get('/images/:id', userController.getImageById);
export default router;