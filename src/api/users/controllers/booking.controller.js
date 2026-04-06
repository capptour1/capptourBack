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
            booking.deliveryInfo = deliveryInfo;
        }
        for (let booking of bookings) {
            booking.images = await BookingDao.getImagesDeliveryById(booking.deliveryInfo.id_entrega);
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