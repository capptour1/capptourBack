import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

const start_transaction = () => {
    return sequelize.transaction({ autocommit: false });
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
        console.log('Update bio DAO called', userId, bio);
        const result = await sequelize.query(
            `UPDATE fotografo.fotografos
            SET descripcion = :bio
            WHERE usuario_id = cast(:userId AS int)
            `,
            {  
                replacements: { userId, bio },
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


export default {
    start_transaction,
    get_photographer_by_id,
    update_bio
};


