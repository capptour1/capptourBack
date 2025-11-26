import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

const start_transaction = () => {
    return sequelize.transaction({ autocommit: false });
}

const get_photographer_by_id = async (userId) => {
    try {
        console.log('Register client controller called');

        const result = await sequelize.query(
            `SELECT u.id AS userId, u.nombre_completo, TRUE AS estado, fp.ubicacion, fp.thumbnail
            FROM auth.usuarios u 
            INNER JOIN fotografo.fotografos f ON
            u.id = f.usuario_id
            INNER JOIN fotografo.foto_portafolio fp ON
            f.id = fp.id_fotografo
            WHERE u.rol_id = 5 AND u.id = cast(:userId AS int)
            `,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        return result[0][0];
    } catch (error) {
        console.error('Error registering client:', error);
        throw new Error('Error al registrar el cliente');
    }
};



export default {
    start_transaction,
    get_photographer_by_id
};


