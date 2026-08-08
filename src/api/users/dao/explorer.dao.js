
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const getExplorerImages = async () => {
    try {
        const query = `
        SELECT s.id_servicio, t.id_imagen, t.thumbnail, f.id as id_fotografo, u.nombre_completo, u.foto_perfil,
        l.longitud, l.latitud
            FROM fotografo.servicios s 
            INNER JOIN fotografo.imagen_servicio t ON s.id_servicio = t.id_servicio
            INNER JOIN fotografo.fotografos f ON s.id_fotografo = f.id
            INNER JOIN auth.usuarios u ON u.id = f.id_usuario
            LEFT JOIN fotografo.localizacion l ON f.id = l.id_fotografo
            ;
        `;
        const result = await sequelize.query(query, { type: QueryTypes.SELECT });
        return result;
    } catch (error) {
        throw new AppError('Error fetching gallery', 500);
    }
};

const getFullImage = async (idImagen) => {
    try {
        const query = `
        SELECT id_imagen, imagen FROM fotografo.imagen_servicio WHERE id_imagen = :idImagen;
        `;
        const result = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { idImagen }
        });
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        throw new AppError('Error fetching full gallery image', 500);
    }
};

export default {
    getExplorerImages,
    getFullImage,
};