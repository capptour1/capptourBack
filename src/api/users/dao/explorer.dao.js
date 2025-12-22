
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';


const get_images = async () => {
    const bookings = await sequelize.query(
        `SELECT fg.id_foto AS id, fg.id_fotografo, u.nombre_completo AS nombre_fotografo,
            fp.thumbnail AS foto_perfil, fg.thumbnail AS foto_galeria
            FROM fotografo.foto_galeria fg
            INNER JOIN fotografo.fotografos f ON fg.id_fotografo = f.id
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            INNER JOIN fotografo.foto_portafolio fp ON fp.id_fotografo = f.id
            ORDER BY fg.id_fotografo
            `,
        { type: QueryTypes.SELECT }
    );
    return bookings;
};

const get_history = async (userId) => {
    const history = await sequelize.query(
        `SELECT fr.id_reserva AS booking_id, fr.id_fotografo AS photo_id, u.nombre_completo AS full_name,
        fp.thumbnail AS profile_image, fr.fecha AS date, fr.hora_inicio AS start_time, fr.hora_fin AS end_time,
        fr.link AS url_download
        FROM fotografo.foto_reserva fr
        INNER JOIN fotografo.fotografos f ON fr.id_fotografo = f.id
        INNER JOIN fotografo.foto_portafolio fp ON fp.id_fotografo = f.id
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        WHERE fr.id_usuario = :userId
        AND fr.estado = 'F'
        ORDER BY fr.id_reserva DESC
        `,
        {
            replacements: { userId },
            type: QueryTypes.SELECT
        }
    );
    return history;
};

const get_rating = async (bookingId) => {
    const rating = await sequelize.query(
        `SELECT fc.id_calif, fc.puntualidad, fc.calidad, fc.profesionalismo, fc.relacion, fc.recomendacion, fc.observacion
        FROM fotografo.foto_calificacion fc
        WHERE id_reserva = :bookingId
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.SELECT
        }
    );
    return rating;

};

const get_bookings_images = async (bookingId) => {
    const images = await sequelize.query(
        `SELECT ri.id_imagen AS id, ri.thumbnail
        FROM fotografo.reserva_imagen ri
        WHERE ri.id_reserva = :bookingId
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.SELECT
        }
    );
    return images;
}

const get_full_image = async (bookingId) => {
    const images = await sequelize.query(
        `SELECT ri.id_imagen AS id, ri.imagen AS image
        FROM fotografo.reserva_imagen ri
        WHERE ri.id_reserva = :bookingId
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.SELECT
        }
    );
    return images;
};


const get_info_bookings = async (bookingId) => {
    const info = await sequelize.query(
        `SELECT fr.id_reserva AS booking_id, u.nombre_completo AS full_name,
        fp.thumbnail, fr.fecha AS date, fp.ubicacion AS location,
        fr.link AS url_download
        FROM fotografo.foto_reserva fr
        INNER JOIN fotografo.fotografos f ON fr.id_fotografo = f.id
        INNER JOIN fotografo.foto_portafolio fp ON fp.id_fotografo = f.id
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        WHERE fr.id_reserva = :bookingId
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.SELECT
        }
    );
    return info;
}


const get_services_by_booking = async (bookingId) => {
    console.log('Get services by booking DAO called', bookingId);
    const services = await sequelize.query(
        `SELECT s.id_servicio, s.nombre, s.descripcion, s.precio_hora_cop, s.precio_hora_usd, s.precio_foto_cop, s.precio_foto_usd
        FROM fotografo.foto_servicio s
        INNER JOIN fotografo.reserva_servicio frs ON s.id_servicio = frs.id_servicio
        WHERE frs.id_reserva = cast(:bookingId AS int)
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.SELECT
        }
    );
    return services;
}


const rate_booking = async (bookingId, punctuality, quality, professionalism, relationship, recommendation, observation) => {
    const result = await sequelize.query(
        `INSERT INTO fotografo.foto_calificacion 
        (id_reserva, puntualidad, calidad, profesionalismo, relacion, recomendacion, observacion)
        VALUES 
        (:bookingId, :punctuality, :quality, :professionalism, :relationship, :recommendation, :observation)
        `,
        {
            replacements: { bookingId, punctuality, quality, professionalism, relationship, recommendation, observation },
            type: QueryTypes.INSERT
        }
    );
    return result;
}

export default {
    get_images,
    get_history,
    get_rating,
    get_bookings_images,
    get_full_image,
    get_info_bookings,
    get_services_by_booking,
    rate_booking
};