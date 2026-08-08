import BookingDao from '../dao/booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;


const getBookingsByUserId = async (req, res) => {
    try {

        const { id_usuario } = req.body;

        const bookings = await BookingDao.getBookingsByUserId(id_usuario);
        if (!bookings.length) {
            return successResponse(
                res,
                [],
                'Reservas obtenidas correctamente'
            );
        }

        const bookingIds = bookings.map(b => b.id_reserva);

        const deliveries = await BookingDao.getDeliveriesByBookingIds(bookingIds);

        const deliveryMap = new Map();
        const deliveryById = new Map();

        deliveries.forEach(delivery => {
            delivery.imagenes_entrega = [];
            deliveryMap.set(delivery.id_reserva, delivery);
            deliveryById.set(delivery.id_entrega, delivery);
        });

        const deliveryIds = [...deliveryById.keys()];

        if (deliveryIds.length) {

            const images = await BookingDao.getImagesDeliveryByIds(deliveryIds);

            images.forEach(image => {
                const delivery = deliveryById.get(image.id_entrega);

                if (delivery) {
                    delivery.imagenes_entrega.push(image);
                }
            });
        }

        const ratings = await BookingDao.getRatingsByBookingIds(bookingIds);

        const ratingMap = new Map();

        ratings.forEach(rating => {
            ratingMap.set(rating.id_reserva, rating);
        });

        bookings.forEach(booking => {
            booking.entrega = deliveryMap.get(booking.id_reserva) || null;
            booking.calificacion = ratingMap.get(booking.id_reserva) || null;
        });

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