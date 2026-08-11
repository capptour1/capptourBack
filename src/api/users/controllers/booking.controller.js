import BookingDao from '../dao/booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const getBookingsByUserId = async (req, res) => {
    try {
        const { id_usuario } = req.body;

        const bookings = await BookingDao.getBookingsByUserId(id_usuario);
      
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