
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


export default {
    get_images
};