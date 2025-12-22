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


const getBookings = async (req, res) => {
    try {
        console.log('Get bookings controller called', req.body);
        const { user_id } = req.body;


        let bookings = await BookingDao.get_bookings_by_user(user_id);
        console.log('Bookings fetched', bookings);
        for (let booking of bookings) {
            const services = await BookingDao.get_services_by_booking(booking.id_reserva);
            booking.servicios = services;

            booking.fecha = formatDate(booking.fecha);
            booking.hora_inicio = formatTime(booking.hora_inicio);
            booking.hora_fin = formatTime(booking.hora_fin);

            console.log('Booking processed', booking);
        }


        return successResponse(res, bookings, 'Reservas obtenidas correctamente');
    } catch (error) {
        return errorResponse(res, error);
    }
};


const cancelBooking = async (req, res) => {
    try {
        console.log('Cancel booking controller called', req.body);
        const { booking_id } = req.body;
        const updatedBooking = await BookingDao.cancel_booking(booking_id);
        return successResponse(res, {
            message: 'Booking cancelled successfully',
        }, 'Estado de la reserva actualizado correctamente');
    } catch (error) {
        return errorResponse(res, error);
    }
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}/${date.getUTCFullYear()}`;
};


const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
};


export default {
    submit_booking,
    getBookings,
    cancelBooking
};