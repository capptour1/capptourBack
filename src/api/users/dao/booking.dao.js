
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

export default {
    get_transaction,
    save_session,
    save_services
};