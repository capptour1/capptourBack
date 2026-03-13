import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

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
        throw new AppError('Fotógrafo no encontrado');
    }
    return photographer[0];
}



const get_photographer_by_id = async (userId) => {
    try {
        console.log('Get photographer by ID DAO called', userId);

        const result = await sequelize.query(
            `SELECT u.id AS userId, u.nombre_completo, u.email as correo , f.is_active AS estado, fp.ubicacion, 
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

const set_status = async (photographerId, transaction) => {

    const result = await sequelize.query(
        `UPDATE fotografo.fotografos f
            SET is_active = NOT is_active
            WHERE id = cast(:photographerId AS int)
        `,
        {
            replacements: { photographerId },
            type: QueryTypes.UPDATE,
            transaction,
            returning: true
        }
    );

    // Retornar el nuevo estado
    const newStatus = await sequelize.query(
        `SELECT is_active
        FROM fotografo.fotografos
        WHERE id = cast(:photographerId AS int)
        `,
        {
            replacements: { photographerId },
            type: QueryTypes.SELECT,
            transaction
        }
    );

    return newStatus[0].is_active;
};

const get_images_portfolio = async (photographerId) => {
    const images = await sequelize.query(
        `SELECT id_foto AS image_id, thumbnail
        FROM fotografo.foto_galeria
        WHERE id_fotografo = cast(:photographerId AS int)
        `,
        {
            replacements: { photographerId },
            type: QueryTypes.SELECT
        }
    );
    return images;
};

const delete_image = async (imageId) => {
    await sequelize.query(
        `DELETE FROM fotografo.foto_galeria
        WHERE id_foto = cast(:imageId AS int)
        `,
        {
            replacements: { imageId },
            type: QueryTypes.DELETE
        }
    );
}

const upload_image_portfolio = async (dataGallery) => {
    await sequelize.query(
        `INSERT INTO fotografo.foto_galeria
        (id_fotografo, imagen, thumbnail)
        VALUES (cast(:id_fotografo AS int), :imagen, :thumbnail)
        `,
        {
            replacements: {
                id_fotografo: dataGallery.id_fotografo,
                imagen: dataGallery.imagen,
                thumbnail: dataGallery.thumbnail
            },
            type: QueryTypes.INSERT
        }
    );
};



// SERVICES MANAGEMENT

const getServices = async (photographerId) => {
    const services = await sequelize.query(
        `SELECT fs.id_servicio, fs.nombre AS nombre_servicio, fs.descripcion, fs.precio_hora_cop, fs.precio_hora_usd,
        fs.precio_foto_cop, fs.precio_foto_usd, fs.fotos_editadas, fs.fotos_sin_editar
        FROM fotografo.foto_servicio fs
        WHERE id_fotografo = cast(:photographerId AS int)
        `,
        {
            replacements: { photographerId },
            type: QueryTypes.SELECT
        }
    );
    return services;
};

const addService = async (photographerId, data) => {
    await sequelize.query(
        `INSERT INTO fotografo.foto_servicio
        (id_fotografo, nombre, descripcion, precio_hora_cop, precio_hora_usd, precio_foto_cop, precio_foto_usd, fotos_editadas, fotos_sin_editar)
        VALUES (cast(:photographerId AS int), :serviceName, :description, :priceHourCop, :priceHourUsd, :pricePhotoCop, :pricePhotoUsd, :photosEdited, :photosUnedited)
        `,
        {
            replacements: {
                photographerId: photographerId,
                serviceName: data.nombre,
                description: data.descripcion,
                priceHourCop: data.precio_hora_cop,
                priceHourUsd: data.precio_hora_usd,
                pricePhotoCop: data.precio_foto_cop,
                pricePhotoUsd: data.precio_foto_usd,
                photosEdited: data.fotos_editadas,
                photosUnedited: data.fotos_sin_editar
            },
            type: QueryTypes.INSERT
        }
    );
};

const deleteService = async (serviceId) => {
    await sequelize.query(
        `DELETE FROM fotografo.foto_servicio
        WHERE id_servicio = cast(:serviceId AS int)
        `,
        {
            replacements: { serviceId },
            type: QueryTypes.DELETE
        }
    );
};


// NUEVO DAO PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL

const getInfoPhotoDbById = async (id_usuario) => {
    const result = await sequelize.query(
        `SELECT f.id AS id_fotografo, 
            null as thumbnail,
            u.nombre_completo as nombre,
            l.latitud, l.longitud
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            INNER JOIN fotografo.localizacion l ON f.id = l.id_fotografo 
            WHERE f.usuario_id = cast(:id_usuario AS int)`
        ,
        {
            replacements: { id_usuario: id_usuario },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

const getInfoSessionPhotoDbById = async (id_usuario) => {
    const result = await sequelize.query(
        `SELECT 
            r.id_reserva, r.fecha, r.hora_inicio, r.hora_fin, r.estado, r.fec_creacion,
            r.latitud, r.longitud,
            c.id as id_cliente, c.nombre_completo as nombre_cliente,
            null as thumbnail_cliente, 
            s.id_servicio, s.nombre as nombre_servicio, s.descripcion as descripcion_servicio,
            s.precio_hora, s.editadas, s.no_editadas,
            tm.codigo
        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        INNER JOIN fotografo.servicios s ON f.id = s.id_fotografo
        INNER JOIN reserva.reserva r ON r.id_servicio = s.id_servicio
        INNER JOIN auth.usuarios c ON r.id_cliente = c.id
        INNER JOIN fotografo.tipo_moneda tm ON s.id_moneda = tm.id_moneda
        WHERE f.usuario_id = cast(:id_usuario AS int)`
        ,
        {
            replacements: { id_usuario: id_usuario },
            type: QueryTypes.SELECT
        }
    );

    return result;
}


export default {
    start_transaction,
    get_photographer_by_id,
    update_bio,
    update_telephone,
    update_info,
    get_photographer_by_user,
    set_status,
    get_images_portfolio,
    delete_image,
    upload_image_portfolio,
    getServices,
    addService,
    deleteService


    // NUEVO DAO PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL
    , getInfoPhotoDbById,
    getInfoSessionPhotoDbById
};


