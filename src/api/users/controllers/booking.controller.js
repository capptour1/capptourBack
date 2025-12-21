import BookingDao from '../dao/booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const submit_booking = async (req, res) => {
    let transaction = null;
    try {
        console.log('Get user by ID controller called', req.body);
        const { userId, photographerId, services, date, startTime, endTime, note } = req.body;

        transaction = await BookingDao.get_transaction();

        const sessionResult = await BookingDao.save_session(userId, photographerId, date, startTime, endTime, note, transaction);

        console.log('Session Result:', sessionResult);

        const reservationId = sessionResult.id_reserva;
        await BookingDao.save_services(reservationId, services, transaction);

        await transaction.commit();


        return successResponse(res, {
            estado: 'success'
        }, 'Booking submitted successfully');
} catch (error) {
    if (transaction) await transaction.rollback();
    return errorResponse(res, error);
}
};

export default {
    submit_booking,
};