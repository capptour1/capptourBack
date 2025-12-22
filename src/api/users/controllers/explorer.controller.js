import explorerDao from '../dao/explorer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

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

const get_images = async (req, res) => {
    try {
        const images = await explorerDao.get_images();
        return successResponse(res, images);
    } catch (error) {
        console.error('Error en get_images controller:', error);
        return errorResponse(res, error);
    }
};

const get_history = async (req, res) => {
    try {
        const { userId } = req.body;
        let history = await explorerDao.get_history(userId);

        for (let element of history) {
            const images = await explorerDao.get_bookings_images(element.booking_id);
            element.photos = images;
            element.real_date = element.date;
            element.date = formatDate(element.date);
            element.start_time = formatTime(element.start_time);
            element.end_time = formatTime(element.end_time);

            // get calification
            const ratingData = await explorerDao.get_rating(element.booking_id);
            if (ratingData.length > 0) {
                // promediar
                const rating = ratingData[0];
                const averageRating = (
                    (rating.puntualidad +
                        rating.calidad +
                        rating.profesionalismo +
                        rating.relacion +
                        rating.recomendacion) / 5
                ).toFixed(1);
                element.rating = parseFloat(averageRating);
            } else {
                element.rating = null;
            }
        }


        return successResponse(res, history);
    } catch (error) {
        console.error('Error en get_history controller:', error);
        return errorResponse(res, error);
    }
};

const get_history_photos = async (req, res) => {
    try {
        const { booking_id } = req.body;
        const images = await explorerDao.get_full_image(booking_id);
        return successResponse(res, images);
    } catch (error) {
        console.error('Error en get_history_photos controller:', error);
        return errorResponse(res, error);
    }
};


const get_info_booking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const info = await explorerDao.get_info_bookings(bookingId);
        if (info.length === 0) {
            throw new AppError('No se encontró la reserva', 404);
        }
        let bookingInfo = info[0];
        const services = await explorerDao.get_services_by_booking(bookingId);

        let promedio = 0;
        for (let service of services) {
            promedio += service.precio;
        }
        promedio = promedio / services.length;

        bookingInfo.services = services;
        bookingInfo.price = promedio.toFixed(2);


        //

        return successResponse(res, bookingInfo);
    }
    catch (error) {
        console.error('Error en get_info_booking controller:', error);
        return errorResponse(res, error);
    }
};

const rate_booking = async (req, res) => {

    try {
        const { reserva_id, puntualidad, calidad, profesionalismo, relacion, recomendacion, observacion } = req.body;

        await explorerDao.rate_booking(reserva_id, puntualidad, calidad, profesionalismo, relacion, recomendacion, observacion);

        return successResponse(res, { message: 'Calificación guardada exitosamente' });
    } catch (error) {
        console.error('Error en rate_booking controller:', error);
        return errorResponse(res, error);
    }
};


export default {
    get_images,
    get_history,
    get_history_photos,
    get_info_booking,
    rate_booking
};