import sequelize from '../models/index.js';
import { QueryTypes } from 'sequelize';

/**
 * Actualiza la ubicación del fotógrafo en tiempo real.
 * Si no existe registro, lo crea (upsert).
 */
const updatePhotographerLocation = async (photographerId, lat, lng) => {
    const existing = await sequelize.query(
        `SELECT id_localizacion FROM fotografo.localizacion 
         WHERE id_fotografo = cast(:id_fotografo AS int) LIMIT 1;`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );

    if (existing.length > 0) {
        await sequelize.query(
            `UPDATE fotografo.localizacion 
             SET latitud = cast(:lat AS float), 
                 longitud = cast(:lng AS float),
                 fec_actualizacion = now()
             WHERE id_fotografo = cast(:id_fotografo AS int);`,
            {
                replacements: { id_fotografo: photographerId, lat, lng },
                type: QueryTypes.UPDATE
            }
        );
    } else {
        await sequelize.query(
            `INSERT INTO fotografo.localizacion (id_fotografo, latitud, longitud, fec_actualizacion)
             VALUES (cast(:id_fotografo AS int), cast(:lat AS float), cast(:lng AS float), now());`,
            {
                replacements: { id_fotografo: photographerId, lat, lng },
                type: QueryTypes.INSERT
            }
        );
    }
};

/**
 * Obtiene el id_fotografo a partir del userId (auth.usuarios.id).
 */
const getPhotographerIdByUserId = async (userId) => {
    const result = await sequelize.query(
        `SELECT id FROM fotografo.fotografos WHERE id_usuario = cast(:userId AS int) LIMIT 1;`,
        {
            replacements: { userId },
            type: QueryTypes.SELECT
        }
    );
    return result[0]?.id ?? null;
};

export default {
    updatePhotographerLocation,
    getPhotographerIdByUserId
};
