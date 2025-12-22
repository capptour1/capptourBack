import pBookingDAO from '../dao/p_booking.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import PhotographerDAO from '../dao/photographer.dao.js';
import sharp from 'sharp';

const { successResponse, errorResponse } = HelperResponse;

const getBookings = async (req, res) => {
    try {
        console.log('Get bookings controller called', req.body);
        const { userId } = req.body;

        const photographer = await PhotographerDAO.get_photographer_by_user(userId);
        console.log('Photographer retrieved', photographer);

        let bookings = await pBookingDAO.get_bookings_by_photographer(photographer.id);
        for (let booking of bookings) {
            const services = await pBookingDAO.get_services_by_booking(booking.id_reserva);
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


const approveBooking = async (req, res) => {
    try {
        console.log('Approve booking controller called', req.body);
        const { bookingId } = req.body;
        const updatedBooking = await pBookingDAO.approve_booking(bookingId);

        return successResponse(res, updatedBooking, 'Estado de la reserva actualizado correctamente');
    } catch (error) {
        return errorResponse(res, error);
    }
};

const submitDelivery = async (req, res) => {
    console.log('Submit delivery controller called', req.body);
    console.log('Files received', req.files);

    let t = null;
    try {
        const { bookingId, downloadLink } = JSON.parse(req.body.data);
        console.log('Parsed data', { bookingId, downloadLink });

        t = await pBookingDAO.get_transaction();

        const resp = await pBookingDAO.update_link_delivery(bookingId, downloadLink, t);
        const galleryFiles = req.files.filter(f => f.fieldname.startsWith("gallery"));
        let dataGallery = [];

        for (let i = 0; i < galleryFiles.length; i++) {
            const file = galleryFiles[i];
            const thumbnailBuffer = await sharp(file.buffer)
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 70 }) // reduce tamaño manteniendo buena calidad
                .toBuffer();
            dataGallery.push({
                id_reserva: bookingId,
                imagen: file.buffer,        // ✅ SOLO el buffer
                thumbnail: thumbnailBuffer  // ✅ buffer válido
            });

        }

        await pBookingDAO.submit_gallery_delivery(dataGallery, t);

        await t.commit();

        return successResponse(res, {
            message: 'Delivery submitted successfully'
        }, 'Entrega de galería enviada correctamente');
    } catch (error) {
        if (t) await t.rollback();
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
    getBookings,
    approveBooking,
    submitDelivery
};