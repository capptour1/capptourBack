
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const createTransaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

const getBookingsByUserId = async (id_usuario) => {

    return sequelize.query(
        `
        SELECT
            r.id_cliente,
            r.id_reserva,
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.estado,
            r.fec_creacion,
            r.latitud,
            r.longitud,
            r.notas,

            f.id AS id_fotografo,

            u.nombre_completo AS nombre_fotografo,
            u.foto_perfil AS thumbnail_fotografo,

            rs.id_reserva_servicio,
            rs.origen,
            rs.id_origen,
            rs.id_tarifa,

            rs.nombre AS nombre_servicio,
            rs.descripcion AS descripcion_servicio,

            rs.cantidad,

            rs.editadas,
            rs.no_editadas,

            rs.precio_base,
            rs.precio_minimo,
            rs.precio_final,

            tm.codigo AS moneda

        FROM reserva.reserva r

        INNER JOIN reserva.reserva_servicio rs
            ON rs.id_reserva = r.id_reserva

        INNER JOIN fotografo.fotografos f
            ON f.id = r.id_fotografo

        INNER JOIN auth.usuarios u
            ON u.id = f.id_usuario

        INNER JOIN fotografo.tipo_moneda tm
            ON tm.id_moneda = rs.id_moneda

        --WHERE r.id_cliente = CAST(:id_usuario AS bigint)

        ORDER BY r.fec_creacion DESC;
        `,
        {
            replacements: {
                id_usuario
            },
            type: QueryTypes.SELECT
        }
    );
};

const getDeliveriesByBookingIds = async (bookingIds) => {

    return sequelize.query(
        `
        SELECT

            id_entrega,
            id_reserva,

            link_gdrive,
            link_icloud,
            link_airdrop,
            link_microsoft

        FROM reserva.entrega

        WHERE estado='A'
        AND id_reserva IN (:bookingIds);
        `,
        {
            replacements: {
                bookingIds
            },
            type: QueryTypes.SELECT
        }
    );
};

const getImagesDeliveryByIds = async (deliveryIds) => {

    return sequelize.query(
        `
        SELECT

            id_imagen,
            id_entrega,
            thumbnail

        FROM reserva.imagenes_entrega

        WHERE id_entrega IN (:deliveryIds)

        ORDER BY id_imagen;
        `,
        {
            replacements: {
                deliveryIds
            },
            type: QueryTypes.SELECT
        }
    );
};

const getRatingsByBookingIds = async (bookingIds) => {

    return sequelize.query(
        `
        SELECT

            id_calificacion,
            id_reserva,

            puntualidad,
            calidad,
            profesionalismo,
            relacion,
            recomendacion,
            comentario

        FROM fotografo.foto_calificacion

        WHERE id_reserva IN (:bookingIds);
        `,
        {
            replacements: {
                bookingIds
            },
            type: QueryTypes.SELECT
        }
    );
};

export default {
    createTransaction,
    getBookingsByUserId,
    getDeliveriesByBookingIds,
    getImagesDeliveryByIds,
    getRatingsByBookingIds,
};