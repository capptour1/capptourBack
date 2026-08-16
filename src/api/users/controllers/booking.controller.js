import BookingDao from '../dao/booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import storageService from '../../../services/storage.service.js';

const { successResponse, errorResponse } = HelperResponse;

const getBookingsByUserId = async (req, res) => {
    try {
        const { id_usuario } = req.body;

        const bookings = await BookingDao.getBookingsByUserId(id_usuario);

        // Resolver URLs de thumbnails en delivery images
        for (const booking of bookings) {
            if (booking.entrega && booking.entrega.imagenes_entrega) {
                for (const img of booking.entrega.imagenes_entrega) {
                    if (img.url_thumbnail) {
                        img.url_thumbnail = storageService.getUrl(img.url_thumbnail);
                    }
                }
            }
        }

        return successResponse(
            res,
            bookings,
            'Reservas obtenidas correctamente'
        );

    } catch (error) {
        return errorResponse(res, error);
    }
};


export default {
    getBookingsByUserId
};
