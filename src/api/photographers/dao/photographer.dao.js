import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

const start_transaction = () => {
    return sequelize.transaction({ autocommit: false });
}

const get_photographer_by_user = async (userId) => {
    const photographer = await sequelize.query(
        `SELECT *
        FROM fotografo.fotografos
        WHERE usuario_id = cast(:userId AS int)
        `,
        {
            replacements: { userId },
            type: QueryTypes.SELECT,
        }
    );

    if (!photographer || photographer.length === 0) {
        throw new Error('Fotógrafo no encontrado');
    }
    return photographer[0];
}



const get_photographer_by_id = async (userId) => {
    try {
        console.log('Get photographer by ID DAO called', userId);

        const result = await sequelize.query(
            `SELECT u.id AS userId, u.nombre_completo, u.email as correo ,TRUE AS estado, fp.ubicacion, 
            fp.descripcion, fp.precio_hora_cop, fp.precio_hora_usd, fp.precio_foto_cop, fp.precio_foto_usd,
            contacto.detalle as telefono, fp.thumbnail
            FROM auth.usuarios u 
            INNER JOIN fotografo.fotografos f ON
            u.id = f.usuario_id
            INNER JOIN fotografo.foto_portafolio fp ON
            f.id = fp.id_fotografo
            LEFT JOIN (
                SELECT *,
                ROW_NUMBER() OVER (PARTITION BY c.id_usuario ORDER BY c.id_contacto DESC) AS rn
                FROM auth.contacto c
                WHERE c.id_usuario = cast(:userId AS int) and c.tipo = 2            
            ) AS contacto ON contacto.id_usuario = u.id AND contacto.rn = 1
            WHERE u.rol_id = 5 AND u.id = cast(:userId AS int)
            `,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        return result[0];
    } catch (error) {
        console.error('Error getting photographer by ID:', error);
        throw new Error('Error al obtener la información del fotógrafo');
    }
};

const update_bio = async (userId, bio, transaction) => {
    try {

        const photographer = await get_photographer_by_user(userId);

        console.log('Update bio DAO called', userId, bio);
        const result = await sequelize.query(
            `UPDATE fotografo.foto_portafolio
            SET descripcion = :bio
            WHERE id_fotografo = cast(:photographerId AS int)
            `,
            {
                replacements: { photographerId: photographer.id, bio },
                type: QueryTypes.UPDATE,
                transaction
            }
        );
        return result;
    } catch (error) {
        console.error('Error updating bio:', error);
        throw new Error('Error al actualizar la biografía del fotógrafo');
    }
};

const update_telephone = async (userId, telephone, transaction) => {
    await sequelize.query(
        `DELETE FROM auth.contacto
        WHERE id_usuario = cast(:userId AS int) AND tipo = 2
        `,
        {
            replacements: { userId },
            type: QueryTypes.DELETE,
            transaction
        }
    );

    const result = await sequelize.query(
        `INSERT INTO auth.contacto
        (id_usuario, detalle, tipo)
        VALUES (cast(:userId AS int), :telephone, 2)
        `,
        {
            replacements: { userId, telephone },
            type: QueryTypes.INSERT,
            transaction
        }
    );
    return result;
};

const update_info = async (userId, data, transaction) => {
    const photographer = await get_photographer_by_user(userId);

    const result = await sequelize.query(
        ` UPDATE fotografo.foto_portafolio
        SET ubicacion = :location, precio_hora_cop = :priceHourCop,
        precio_hora_usd = :priceHourUsd, precio_foto_cop = :pricePhotoCop,
        precio_foto_usd = :pricePhotoUsd
        WHERE id_fotografo = cast(:userId AS int)
        `,
        {
            replacements: { userId: photographer[0].id, location: JSON.stringify(data.location), priceHourCop: data.priceHourCop, priceHourUsd: data.priceHourUsd, pricePhotoCop: data.pricePhotoCop, pricePhotoUsd: data.pricePhotoUsd },
            type: QueryTypes.UPDATE,
            transaction,
            returning: true
        }
    ); 
    return result;
}

const toggle_status = async (userId, transaction) => {
    const photographer = await get_photographer_by_user(userId);

    const result = await sequelize.query(
        `UPDATE fotografo.foto_portafolio
        SET is_active = NOT is_active
        WHERE id_fotografo = cast(:photographerId AS int)
        `,
        {
            replacements: { photographerId: photographer.id },
            type: QueryTypes.UPDATE,
            transaction,
            returning: true
        }
    );
    return result;
};

const get_status = async (userId) => {
    const photographer = await get_photographer_by_user(userId);
    return photographer;
};

export default {
    start_transaction,
    get_photographer_by_id,
    update_bio,
    update_telephone,
    update_info
};


