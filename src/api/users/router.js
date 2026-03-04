import express from 'express';
import mapController from './controllers/map.controller.js';
import userController from './controllers/user.controller.js';
import bookingController from './controllers/booking.controller.js';
import explorerController from './controllers/explorer.controller.js';

const router = express.Router();


router.post('/profile', userController.get_user_by_id);
router.post('/nearby-photographers', mapController.getNearbyPhotographers);
router.post('/nearby-photo-by-id', mapController.get_photo_by_id);

router.post('/gallery-photographer', mapController.get_gallery_photographer);
router.post('/services-photographer', mapController.get_services_photographer);
router.post('/submit-booking', bookingController.submit_booking);

router.post('/get-bookings', bookingController.getBookings);
router.post('/cancel-booking', bookingController.cancelBooking);

router.post('/explorer-images', explorerController.get_images);
router.post('/explorer-history', explorerController.get_history);
router.post('/explorer-history-photos', explorerController.get_history_photos);

router.post('/get-info-booking', explorerController.get_info_booking);
router.post('/rate-booking', explorerController.rate_booking);


// NEW ROUTES
router.post('/search-photographers', mapController.searchPhotographers);
router.post('/get-monedas', userController.get_monedas);

export default router;