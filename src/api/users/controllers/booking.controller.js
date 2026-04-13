import BookingDao from '../dao/booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;


const getBookingsByUserId = async (req, res) => {
    try {
        const { id_usuario } = req.body;
        console.log('Get bookings by user ID controller called', req.body);
        let bookings = await BookingDao.getBookingsByUserId(id_usuario);
        for (let booking of bookings) {
            const deliveryInfo = await BookingDao.getDeliveryInfoByBookingId(booking.id_reserva);
            booking.entrega = deliveryInfo;
        }
        for (let booking of bookings) {
            if (!booking.entrega) continue; // Si no hay información de entrega, saltar a la siguiente reserva
            booking.imagenes_entrega = await BookingDao.getImagesDeliveryById(booking.entrega.id_entrega);
            booking.calificacion = await BookingDao.getRatingByBookingId(booking.id_reserva);
        }

        return successResponse(res, bookings, 'Reservas obtenidas correctamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};




export default {
    getBookingsByUserId
};