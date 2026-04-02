import express from 'express';
import mapController from './controllers/map.controller.js';
import userController from './controllers/user.controller.js';
import bookingController from './controllers/booking.controller.js';
import explorerController from './controllers/explorer.controller.js';

const router = express.Router();


// NEW ROUTES
router.post('/search-photographers', mapController.searchPhotographers);
router.post('/get-monedas', userController.get_monedas);
router.post('/get-info-photographer', userController.getInfoPhotoById);
router.post('/get-services-gallery-photographer', userController.getServicesGalleryByPhotographerId);
router.post('/get-services-photographer', userController.getServicesByPhotographerId);
router.post('/add-service-request', userController.addServiceRequest);


router.post('/getCountries', userController.getCountries);
router.post('/getGenders', userController.getGenders);

router.post('/getInfoUserById', userController.getInfoUserById);
export default router;