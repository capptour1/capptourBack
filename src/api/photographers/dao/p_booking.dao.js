import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const get_transaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}


const get_bookings_by_photographer = async (photographerId) => {
    console.log('Get bookings by photographer DAO called', photographerId);
    const bookings = await sequelize.query(
        `SELECT fr.id_reserva, fr.id_usuario, fr.id_fotografo, u.nombre_completo AS nombre_cliente, fr.fecha, 
            fr.hora_inicio, fr.hora_fin, 0 as mensajes_no_leidos,
            fr.estado
            FROM fotografo.foto_reserva fr
            INNER JOIN auth.usuarios u ON fr.id_usuario = u.id
            WHERE fr.id_fotografo = cast(:photographerId AS int)
            ORDER BY fr.fecha DESC, fr.hora_inicio DESC
            `,
        {
            replacements: { photographerId },
            type: QueryTypes.SELECT
        }
    );
    return bookings;
};

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

const approve_booking = async (bookingId) => {
    console.log('Approve booking DAO called', bookingId);
    const [results, metadata] = await sequelize.query(
        `UPDATE fotografo.foto_reserva
        SET estado = 'A'
        WHERE id_reserva = cast(:bookingId AS int)
        RETURNING *;
        `,
        {
            replacements: { bookingId },
            type: QueryTypes.UPDATE
        }
    );
    return results[0];
};

const update_link_delivery = async (bookingId, downloadLink, transaction) => {
    console.log('Update link delivery DAO called', bookingId, downloadLink);
    const [results, metadata] = await sequelize.query(
        `UPDATE fotografo.foto_reserva
        SET link = :downloadLink, estado = 'F'
        WHERE id_reserva = cast(:bookingId AS int)
        RETURNING *;
        `,
        {
            replacements: { bookingId, downloadLink },
            type: QueryTypes.UPDATE,
            transaction
        }
    );
    return results[0];
};

const submit_gallery_delivery = async (dataGallery, transaction) => {
    for (const item of dataGallery) {
        await sequelize.query(
            `
      INSERT INTO fotografo.reserva_imagen
      (id_reserva, imagen, thumbnail)
      VALUES ($1, $2, $3)
      `,
            {
                bind: [
                    Number(item.id_reserva),
                    item.imagen,     // Buffer
                    item.thumbnail,  // Buffer
                ],
                type: QueryTypes.INSERT,
                transaction,
            }
        );
    }
};



export default {
    get_transaction,
    get_bookings_by_photographer,
    get_services_by_booking,
    approve_booking,
    update_link_delivery,
    submit_gallery_delivery
};
