
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';



// NUEVO DAO PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL

const getTransaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

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
        `SELECT f.id AS id_fotografo, 
            u.nombre_completo as nombre,
            NULL AS biografia, NULL AS herramientas,
            5 AS rating, 120 AS reservas, TRUE AS favorito,
            '3162388201' AS celular,
            l.latitud, l.longitud,
            te.descripcion AS experiencia,
            tr.descripcion AS rol
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
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
        `SELECT s.id_servicio, s.nombre, s.descripcion, s.precio_hora, s.editadas, s.no_editadas, tm.id_moneda, tm.codigo, s.id_fotografo 
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


const addServiceRequest = async (reservationData, transaction) => {
    const { id_cliente, id_servicio, fecha, hora_inicio, hora_fin, longitud, latitud, notas } = reservationData;
    const result = await sequelize.query(
        `INSERT INTO reserva.reserva (id_cliente, id_servicio, fecha, hora_inicio, hora_fin, longitud, latitud, notas)
         VALUES (cast(:id_cliente AS int), cast(:id_servicio AS int), cast(:fecha AS date), cast(:hora_inicio AS time), cast(:hora_fin AS time), cast(:longitud AS float), cast(:latitud AS float), :notas)
         RETURNING id_reserva;`,    
        {
            replacements: { id_cliente, id_servicio, fecha, hora_inicio, hora_fin, longitud, latitud, notas },
            type: QueryTypes.INSERT,
            transaction: transaction
        }
    );
    return result[0][0]; 
}

const getBasicInfoPhotographerById = async (photographerId) => {
    const result = await sequelize.query(
        `SELECT f.id AS id_fotografo,
            u.nombre_completo as nombre,
            te.descripcion AS experiencia,
            tr.descripcion AS rol
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            INNER JOIN fotografo.tipo_experiencia te ON f.id_experiencia = te.id_experiencia
            INNER JOIN fotografo.tipo_rol tr ON f.id_rol = tr.id_rol
            WHERE f.id = cast(:id_fotografo AS int);`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    console.log('DAO - Basic info photographer result:', result);
    return result[0];
}

const getBasicInfoServiceById = async (serviceId) => {
    const result = await sequelize.query(
        `SELECT id_servicio, nombre FROM fotografo.servicios WHERE id_servicio = cast(:id_servicio AS int);`,
        {
            replacements: { id_servicio: serviceId },
            type: QueryTypes.SELECT
        }
    );
    console.log('DAO - Basic info service result:', result);
    return result[0];
}


const getCountries = async () => {
    const result = await sequelize.query(
        `SELECT * FROM public.paises;`,
        {
            type: QueryTypes.SELECT
        }
    );
    return result;
};

const getGenders = async () => {
    const result = await sequelize.query(
        `SELECT * FROM public.generos;`,
        {
            type: QueryTypes.SELECT
        }
    );
    return result;
};

const getInfoUserById = async (userId) => {
    const result = await sequelize.query(
        `SELECT u.id as id_usuario, u.nombre_completo, u.email,
        u.fecha_nacimiento, u.foto_perfil,
        p.id_pais as pais_telefono,
        p.codigo_telefono, ut.telefono, 
        p2.id_pais as pais_usuario, p2.nombre as nombre_pais_usuario,
        p2.iso_code,
        f.descripcion, f.herramientas,
        g.id_genero, g.descripcion as genero
        FROM auth.usuarios u
        LEFT JOIN auth.usuario_telefono ut ON u.id = ut.id_usuario
        LEFT JOIN public.paises p ON ut.id_pais = p.id_pais
        LEFT JOIN public.paises p2 ON u.id_pais = p2.id_pais
        LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
        LEFT JOIN public.generos g ON u.id_genero = g.id_genero
        WHERE u.id = cast(:id_usuario AS int);`,
        {
            replacements: { id_usuario: userId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

export default {
    getTransaction,
    get_monedas,
    getInfoPhotoById,
    getInfoServicesByPhotographerId,
    getInfoGalleryByPhotographerId,
    loadFullImageById,
    addServiceRequest,
    getBasicInfoPhotographerById,
    getBasicInfoServiceById,
    getCountries,
    getGenders,
    getInfoUserById
};