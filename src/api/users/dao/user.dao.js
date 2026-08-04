
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
            u.nombre_completo as nombre, u.foto_perfil as thumbnail, u.rol_id as id_rol, u.fecha_nacimiento,
            f.descripcion AS biografia, f.herramientas,
            5 AS rating, 120 AS reservas, TRUE AS favorito,
            CONCAT(p.codigo_telefono, ' ', ut.telefono) AS celular,
            l.latitud, l.longitud,
            te.descripcion AS experiencia,
            tr.descripcion AS rol
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            LEFT JOIN fotografo.localizacion l ON f.id = l.id_fotografo 
            INNER JOIN fotografo.tipo_experiencia te ON f.id_experiencia = te.id_experiencia 
            INNER JOIN fotografo.tipo_rol tr ON f.id_rol = tr.id_rol 
            LEFT JOIN auth.usuario_telefono ut ON u.id = ut.id_usuario
            LEFT JOIN public.paises p ON ut.id_pais = p.id_pais
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
            u.foto_perfil as thumbnail,
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

const getInfoUserById = async (userId, id_rol) => {
    let query = '';
    if (id_rol === 3) {
        query = `
        SELECT u.id as id_usuario, u.nombre_completo, u.email,
        u.foto_perfil as thumbnail,
        u.rol_id as id_rol,
        u.fecha_nacimiento, u.foto_perfil,
        p.id_pais as pais_telefono,
        p.codigo_telefono, ut.telefono, 
        p2.id_pais as pais_usuario, p2.nombre as nombre_pais_usuario,
        p2.iso_code,
        g.id_genero, g.descripcion as genero
        FROM auth.usuarios u
        LEFT JOIN auth.usuario_telefono ut ON u.id = ut.id_usuario
        LEFT JOIN public.paises p ON ut.id_pais = p.id_pais
        LEFT JOIN public.paises p2 ON u.id_pais = p2.id_pais
        LEFT JOIN public.generos g ON u.id_genero = g.id_genero
        WHERE u.id = cast(:id_usuario AS int);
        `;
    } else if (id_rol === 5) {
        query = `
        SELECT u.id as id_usuario, u.nombre_completo, u.email,
        u.foto_perfil as thumbnail,
        f.id AS id_fotografo,
        u.rol_id as id_rol, l.longitud, l.latitud,
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
        LEFT JOIN fotografo.localizacion l ON f.id = l.id_fotografo
        WHERE u.id = cast(:id_usuario AS int);
        `;
    }
    const result = await sequelize.query(
        query,
        {
            replacements: { id_usuario: userId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};


const updateProfilePicture = async (userId, photoData) => {
    const result = await sequelize.query(
        `UPDATE auth.usuarios SET foto_perfil = :foto_perfil WHERE id = cast(:id_usuario AS int) RETURNING id, foto_perfil AS thumbnail;`,
        {
            replacements: { id_usuario: userId, foto_perfil: photoData },
            type: QueryTypes.UPDATE
        }
    );
    return result[0][0];
};


const updateProfile = async (userId, info, t) => {
    const result = await sequelize.query(
        `UPDATE auth.usuarios SET nombre_completo = :nombre_completo, id_pais = cast(:pais_usuario AS int), id_genero = cast(:id_genero AS int), fecha_nacimiento = cast(:fecha_nacimiento AS date) 
        WHERE id = cast(:id_usuario AS int) RETURNING id;`,
        {
            replacements: { ...info, id_usuario: userId },
            type: QueryTypes.UPDATE,
            transaction: t
        }
    );
    return result[0][0];
};

const updateInfoPhoneByUserId = async (userId, infoPhone, t) => {
    console.log('DAO - updateInfoPhoneByUserId called with:', { userId, infoPhone });
    // crear si no existe, actualizar si existe
    const existingPhone = await sequelize.query(
        `SELECT id_usuario FROM auth.usuario_telefono WHERE id_usuario = cast(:id_usuario AS int);`,
        {
            replacements: { id_usuario: userId },
            type: QueryTypes.SELECT,
            transaction: t
        }
    );
    if (existingPhone.length > 0) {
        // actualizar
        const result = await sequelize.query(
            `UPDATE auth.usuario_telefono SET id_pais = cast(:pais_telefono AS int), telefono = :telefono WHERE id_usuario = cast(:id_usuario AS int) RETURNING id_usuario;`,
            {
                replacements: { ...infoPhone, id_usuario: userId },
                type: QueryTypes.UPDATE
            }
        );
        return result[0][0];
    } else {
        // crear
        const result = await sequelize.query(
            `INSERT INTO auth.usuario_telefono (id_usuario, id_pais, telefono) VALUES (cast(:id_usuario AS int), cast(:pais_telefono AS int), :telefono) RETURNING id_usuario;`,
            {
                replacements: { ...infoPhone, id_usuario: userId },
                type: QueryTypes.INSERT
            }
        );
        return result[0][0];
    }
};

const updateInfoPhotographerById = async (userId, infoPhotographer, t) => {
    const result = await sequelize.query(
        `UPDATE fotografo.fotografos SET descripcion = :descripcion, herramientas = :herramientas WHERE usuario_id = cast(:id_usuario AS int) RETURNING id;`,
        {
            replacements: { ...infoPhotographer, id_usuario: userId },
            type: QueryTypes.UPDATE,
            transaction: t
        }
    );
    return result[0][0];
}


const submitServiceRating = async (ratingData) => {
    const result = await sequelize.query(
        `INSERT INTO fotografo.foto_calificacion (id_reserva, puntualidad, calidad, profesionalismo, relacion, recomendacion, comentario)
         VALUES (cast(:id_reserva AS int), cast(:puntualidad AS int), cast(:calidad_fotos AS int), cast(:profesionalismo AS int), cast(:relacion_calidad_precio AS int), cast(:recomendacion AS int), :comentario)
         RETURNING *;`,
        {
            replacements: { ...ratingData },
            type: QueryTypes.INSERT
        }
    );
    return result[0][0];
}


const getFullImagesByBookingId = async (id_reserva) => {
    const images = await sequelize.query(
        ` SELECT i.id_imagen
        FROM reserva.imagenes_entrega i
        INNER JOIN reserva.entrega e ON i.id_entrega = e.id_entrega
        WHERE e.id_reserva = cast(:id_reserva AS int);
            `,
        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT,
        }
    );
    return images;
}

const getImageById = async (id_imagen) => {
  const result = await sequelize.query(
    `SELECT imagen FROM reserva.imagenes_entrega
     WHERE id_imagen = :id_imagen`,
    {
      replacements: { id_imagen },
      type: QueryTypes.SELECT,
    }
  );

  return result[0]?.imagen;
};

const createInstantSession = async (data, transaction) => {
    const { id_cliente, id_fotografo, id_servicio, latitud, longitud } = data;

    // Si no se proporcionó servicio, tomar el primero activo del fotógrafo
    let serviceId = id_servicio;
    if (!serviceId) {
        const services = await sequelize.query(
            `SELECT id_servicio FROM fotografo.servicios 
             WHERE id_fotografo = cast(:id_fotografo AS int) AND estado = 'A' 
             ORDER BY fec_creacion DESC LIMIT 1;`,
            {
                replacements: { id_fotografo },
                type: QueryTypes.SELECT,
                transaction
            }
        );
        if (services.length === 0) {
            throw new Error('El colaborador no tiene servicios activos');
        }
        serviceId = services[0].id_servicio;
    }

    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora_inicio = `${now.getHours()}:${now.getMinutes()}`;
    const hora_fin_date = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
    const hora_fin = `${hora_fin_date.getHours()}:${hora_fin_date.getMinutes()}`;

    const result = await sequelize.query(
        `INSERT INTO reserva.reserva (id_cliente, id_servicio, fecha, hora_inicio, hora_fin, longitud, latitud, estado, notas)
         VALUES (cast(:id_cliente AS int), cast(:id_servicio AS int), cast(:fecha AS date), 
                 cast(:hora_inicio AS time), cast(:hora_fin AS time), 
                 cast(:longitud AS float), cast(:latitud AS float), 'C', 'Sesión inmediata vía QR')
         RETURNING id_reserva;`,
        {
            replacements: { 
                id_cliente, 
                id_servicio: serviceId, 
                fecha, 
                hora_inicio, 
                hora_fin,
                longitud: longitud || null, 
                latitud: latitud || null 
            },
            type: QueryTypes.INSERT,
            transaction
        }
    );
    return result[0][0];
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
    getInfoUserById,
    updateProfilePicture,
    updateProfile,
    updateInfoPhoneByUserId,
    updateInfoPhotographerById,
    submitServiceRating,
    getFullImagesByBookingId,
    getImageById,
    createInstantSession
};