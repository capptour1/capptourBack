
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const get_user_by_id = async (userId) => {
    const result = await sequelize.query(
        `SELECT u.id AS userId, u.nombre_completo, u.email as correo ,TRUE AS estado, 
            contacto.detalle as telefono
            FROM auth.usuarios u 
            LEFT JOIN (
                SELECT *,
                ROW_NUMBER() OVER (PARTITION BY c.id_usuario ORDER BY c.id_contacto DESC) AS rn
                FROM auth.contacto c
                WHERE c.id_usuario = cast(:userId AS int) and c.tipo = 2            
            ) AS contacto ON contacto.id_usuario = u.id AND contacto.rn = 1
            WHERE u.rol_id = 3 AND u.id = cast(:userId AS int)
            `,
        {
            replacements: { userId },
            type: QueryTypes.SELECT
        }
    );
    if (result.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
    }
    return result[0];

};


const get_info_photo_by_id = async (userId) => {
    const result = await sequelize.query(
        `SELECT u.id AS userId, u.nombre_completo, u.email as correo ,TRUE AS estado,
            contacto.detalle as telefono, p.descripcion, p.url_portada, p.url_perfil, p.url_galeria, p.url_redes_sociales, p.url_otros, p.id AS id_portafolio
            FROM auth.usuarios u 
            LEFT JOIN (
                SELECT *,       
                ROW_NUMBER() OVER (PARTITION BY c.id_usuario ORDER BY c.id_contacto DESC) AS rn
                FROM auth.contacto c
                WHERE c.id_usuario = cast(:userId AS int) and c.tipo = 2
            ) AS contacto ON contacto.id_usuario = u.id AND contacto.rn = 1
            LEFT JOIN portafolio p ON p.id_usuario = u.id
            WHERE u.rol_id = 3 AND u.id = cast(:userId AS int)
            `,
        {
            replacements: { userId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

const get_monedas = async () => {
  const result = await sequelize.query(
    `SELECT * FROM fotografo.tipo_moneda;`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return result;

};

export default {
    get_user_by_id,
    get_info_photo_by_id,
    get_monedas
};