
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const get_transaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

const save_session = async (userId, photographerId, date, startTime, endTime, note, transaction) => {
    const insertQuery = `
    INSERT INTO fotografo.foto_reserva
    (id_usuario, id_fotografo, fecha, hora_inicio, hora_fin, nota)
    VALUES (:userId, :photographerId, :date, :startTime, :endTime, :note)
    RETURNING *;
`;

    const [rows] = await sequelize.query(insertQuery, {
        replacements: { userId, photographerId, date, startTime, endTime, note },
        transaction
    });

    return rows[0]; // registro insertado

}

const save_services = async (reservationId, services, transaction) => {
    const insertQuery = `
        INSERT INTO fotografo.reserva_servicio (id_reserva, id_servicio)
        VALUES (:reservationId, :serviceId)
    `;
    for (const serviceId of services) {
        await sequelize.query(insertQuery, {
            replacements: { reservationId, serviceId },
            type: QueryTypes.INSERT,
            transaction
        });
    }
    return true;
}

const get_bookings_by_user = async (userId) => {
    console.log('Get bookings by user DAO called', userId);
    const bookings = await sequelize.query(
        `SELECT fr.id_reserva, fr.id_usuario, u.nombre_completo AS nombre_fotografo, fr.fecha, 
            fr.hora_inicio, fr.hora_fin, 0 as mensajes_no_leidos,
            fr.estado
            FROM fotografo.foto_reserva fr
            INNER JOIN fotografo.fotografos f ON fr.id_fotografo = f.id
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            WHERE fr.id_usuario = cast(:userId AS int)
            ORDER BY fr.fecha DESC, fr.hora_inicio DESC
            `,
        {
            replacements: { userId },
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

const cancel_booking = async (bookingId) => {
    console.log('Cancel booking DAO called', bookingId);
    const [results, metadata] = await sequelize.query(
        `UPDATE fotografo.foto_reserva
        SET estado = 'C'
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

export default {
    get_transaction,
    save_session,
    save_services,
    get_bookings_by_user,
    get_services_by_booking,
    cancel_booking
};