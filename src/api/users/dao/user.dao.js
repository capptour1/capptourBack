
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';



// NUEVO DAO PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL

const get_monedas = async () => {
  const result = await sequelize.query(
    `SELECT * FROM fotografo.tipo_moneda;`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return result;

};


const getInfoPhotoById = async (photographerId) => {
    const result = await sequelize.query(
        `SELECT f.id AS id_fotografo, NULL AS biografia, NULL AS herramientas,
            5 AS rating, 120 AS reservas, TRUE AS favorito,
            '3162388201' AS celular,
            l.latitud, l.longitud,
            te.descripcion AS experiencia,
            tr.descripcion AS rol
            FROM fotografo.fotografos f 
            INNER JOIN fotografo.localizacion l ON f.id = l.id_fotografo 
            INNER JOIN fotografo.tipo_experiencia te ON f.id_experiencia = te.id_experiencia 
            INNER JOIN fotografo.tipo_rol tr ON f.id_rol = tr.id_rol 
            WHERE f.id = cast(:id_fotografo AS int);`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

const getInfoServicesByPhotographerId = async (photographerId) => {
    const result = await sequelize.query(
        `SELECT s.id_servicio, s.nombre, s.descripcion, s.precio_hora, s.editadas, s.no_editadas, tm.id_moneda, tm.codigo 
            FROM fotografo.servicios s 
            INNER JOIN fotografo.tipo_moneda tm ON s.id_moneda = tm.id_moneda 
            WHERE s.id_fotografo = cast(:id_fotografo AS int);`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    return result;
};

const getInfoGalleryByPhotographerId = async (photographerId) => {
    const result = await sequelize.query(
        `SELECT s.id_servicio, t.id_imagen, t.thumbnail 
            FROM fotografo.servicios s 
            INNER JOIN fotografo.imagen_servicio t ON s.id_servicio = t.id_servicio 
            WHERE s.id_fotografo = cast(:id_fotografo AS int);`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    return result;
}

const loadFullImageById = async (imageId) => {
    const result = await sequelize.query(
        `SELECT id_imagen, imagen FROM fotografo.imagen_servicio WHERE id_imagen = cast(:id_imagen AS int);`,
        {
            replacements: { id_imagen: imageId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

export default {
    get_monedas,
    getInfoPhotoById,
    getInfoServicesByPhotographerId,
    getInfoGalleryByPhotographerId,
    loadFullImageById
};