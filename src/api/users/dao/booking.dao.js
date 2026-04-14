
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const createTransaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

const getBookingsByUserId = async (id_usuario) => {
    const bookings = await sequelize.query(
        `
        SELECT
        r.id_reserva, r.fecha, r.hora_inicio, r.hora_fin, r.estado, r.fec_creacion,
        r.latitud, r.longitud,
        r.id_cliente,
        f.id as id_fotografo, u.nombre_completo as nombre_fotografo, 
        u.foto_perfil as thumbnail_fotografo, 
        s.id_servicio, s.nombre as nombre_servicio, s.descripcion as descripcion_servicio,
        s.precio_hora, s.editadas, s.no_editadas,
        tm.codigo
        FROM reserva.reserva r
        INNER JOIN fotografo.servicios s
            ON r.id_servicio = s.id_servicio  
        INNER JOIN fotografo.fotografos f
            ON s.id_fotografo = f.id
        INNER JOIN auth.usuarios u 
            ON f.usuario_id = u.id
        INNER JOIN auth.usuarios c 
            ON r.id_cliente = c.id
        INNER JOIN fotografo.tipo_moneda tm
            ON s.id_moneda = tm.id_moneda
        WHERE c.id = cast(:id_usuario AS int);
         `,
        {
            replacements: { id_usuario },
            type: QueryTypes.SELECT,
        }
    );
    return bookings;
}

const getDeliveryInfoByBookingId = async (id_reserva) => {
    const deliveryInfo = await sequelize.query(
        `
        SELECT id_entrega, id_reserva, link_gdrive, link_icloud, link_airdrop, link_microsoft
        FROM reserva.entrega d
        WHERE d.id_reserva = cast(:id_reserva AS int) 
        AND d.estado = 'A';
         `,
        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT,
        }
    );
    return deliveryInfo[0];
}

const getImagesDeliveryById = async (id_entrega) => {
    const images = await sequelize.query(
        `
        SELECT id_imagen, thumbnail, id_entrega
        FROM reserva.imagenes_entrega i
        WHERE i.id_entrega = cast(:id_entrega AS int);
         `,
        {
            replacements: { id_entrega },
            type: QueryTypes.SELECT,
        }
    );
    return images;
}


const getRatingByBookingId = async (id_reserva) => {
    const rating = await sequelize.query(
        `SELECT id_calificacion, id_reserva, puntualidad, calidad, profesionalismo, relacion, recomendacion, comentario
         FROM fotografo.foto_calificacion
         WHERE id_reserva = cast(:id_reserva AS int);`,
        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT,
        }
    );
    return rating[0];
}

     



export default {
    createTransaction,
    getBookingsByUserId,
    getDeliveryInfoByBookingId,
    getImagesDeliveryById,
    getRatingByBookingId,
};