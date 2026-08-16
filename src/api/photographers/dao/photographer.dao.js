import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const start_transaction = () => {
    return sequelize.transaction({ autocommit: false });
}





// NUEVO DAO PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL

const getInfoPhotoDbById = async (id_usuario) => {
    const result = await sequelize.query(
        `SELECT f.id AS id_fotografo, 
            u.foto_perfil as thumbnail,
            u.nombre_completo as nombre,
            l.latitud, l.longitud,
            f.is_active as disponibilidad,
            f.id_experiencia, f.id_rol
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.id_usuario = u.id
            LEFT JOIN fotografo.localizacion l ON f.id = l.id_fotografo 
            WHERE f.id_usuario = cast(:id_usuario AS int)`
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
        `
        SELECT
            r.id_reserva,
            r.id_fotografo,
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.estado,
            r.notas,
            r.fec_creacion,
            r.latitud,
            r.longitud,

            c.id                      AS id_cliente,
            c.nombre_completo         AS nombre_cliente,
            c.foto_perfil             AS thumbnail_cliente,

            rs.id_reserva_servicio,
            rs.origen,
            rs.id_origen,
            rs.id_tarifa,

            rs.nombre                 AS nombre_servicio,
            rs.descripcion            AS descripcion_servicio,

            rs.cantidad,

            rs.editadas,
            rs.no_editadas,

            rs.precio_base,
            rs.precio_minimo,
            rs.precio_final,

            tm.id_moneda,
            tm.codigo,
            tm.simbolo

        FROM reserva.reserva r

        INNER JOIN fotografo.fotografos f
            ON f.id = r.id_fotografo

        INNER JOIN auth.usuarios c
            ON c.id = r.id_cliente

        INNER JOIN reserva.reserva_servicio rs
            ON rs.id_reserva = r.id_reserva

        INNER JOIN public.tipo_moneda tm
            ON tm.id_moneda = rs.id_moneda

        WHERE f.id_usuario = CAST(:id_usuario AS int)

        ORDER BY r.fecha DESC,
                r.hora_inicio DESC,
                r.fec_creacion DESC;
        `,
        {
            replacements: { id_usuario },
            type: QueryTypes.SELECT
        }
    );

    return result;
}

const changeStatusSession = async (id_reserva, estado) => {
    await sequelize.query(
        `UPDATE reserva.reserva
        SET estado = :estado
        WHERE id_reserva = cast(:id_reserva AS int)
        `,
        {
            replacements: { id_reserva, estado },
            type: QueryTypes.UPDATE
        }
    );
}

const changeAvailability = async (id_usuario, disponibilidad) => {
    await sequelize.query(
        `UPDATE fotografo.fotografos
        SET is_active = cast(:disponibilidad AS boolean)
        WHERE id_usuario = cast(:id_usuario AS int)
        `,
        {
            replacements: { id_usuario, disponibilidad },
            type: QueryTypes.UPDATE
        }
    );
}

const createDelivery = async (id_reserva, transaction) => {
    // verificar si ya existe una entrega para esta reserva
    const existingDelivery = await sequelize.query(
        `SELECT id_entrega
        FROM reserva.entrega
        WHERE id_reserva = cast(:id_reserva AS int) AND estado = 'A'
        `,

        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT
        }
    );
    if (existingDelivery && existingDelivery.length > 0) {
        return existingDelivery[0];
    }

    const result = await sequelize.query(
        `INSERT INTO reserva.entrega (id_reserva)
     VALUES (cast(:id_reserva AS int))
     RETURNING *`,
        {
            replacements: { id_reserva },
            type: QueryTypes.INSERT,
            transaction,
        }
    );

    return result[0][0];

}

const dropImagesDelivery = async (id_reserva, transaction) => {
    // First, get the delivery ID associated with the reservation
    const delivery = await sequelize.query(
        `SELECT id_entrega
        FROM reserva.entrega
        WHERE id_reserva = cast(:id_reserva AS int)
        `,
        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT
        }
    );

    if (delivery && delivery.length > 0) {
        const id_entrega = delivery[0].id_entrega;


        await sequelize.query(
            `DELETE FROM reserva.imagenes_entrega
        WHERE id_entrega = cast(:id_entrega AS int)
        `,
            {
                replacements: { id_entrega },
                type: QueryTypes.DELETE,
                transaction
            }
        );
    }


}

const uploadImagesDelivery = async (dataImages, transaction) => {
    for (const data of dataImages) {
        await sequelize.query(
            `INSERT INTO reserva.imagenes_entrega (id_entrega, imagen, thumbnail)
            VALUES (cast(:id_entrega AS int), :imagen, :thumbnail)
            `,
            {
                replacements: {
                    id_entrega: data.id_entrega,
                    imagen: data.imagen,
                    thumbnail: data.thumbnail
                },
                type: QueryTypes.INSERT,
                transaction
            }
        );
    }

    const result = await sequelize.query(
        `SELECT id_entrega, thumbnail
        FROM reserva.imagenes_entrega
        WHERE id_entrega = cast(:id_entrega AS int)
        `,
        {
            replacements: { id_entrega: dataImages[0].id_entrega },
            type: QueryTypes.SELECT,
            transaction
        }
    );
    return result;
}

const uploadImageDelivery = async (dataPicture, transaction) => {
    const result = await sequelize.query(
        `INSERT INTO reserva.imagenes_entrega (id_entrega, url_imagen, url_thumbnail, nombre, mime_type, tamano)
        VALUES (cast(:id_entrega AS int), :url_imagen, :url_thumbnail, :nombre, :mime_type, :tamano)
            RETURNING id_imagen, url_imagen, url_thumbnail, nombre, mime_type, tamano
        `,
        {
            replacements: {
                id_entrega: dataPicture.id_entrega,
                url_imagen: dataPicture.url_imagen,
                url_thumbnail: dataPicture.url_thumbnail,
                nombre: dataPicture.nombre || null,
                mime_type: dataPicture.mime_type || 'image/jpeg',
                tamano: dataPicture.tamano || null,
            },
            type: QueryTypes.INSERT,
            transaction
        }
    );
    return result[0][0];
}


const uploadLinksDelivery = async (id_entrega, dataLinks, transaction) => {
    const { gdrive_link, icloud_link, airdrop_link, microsoft_link } = dataLinks;
    await sequelize.query(
        `UPDATE reserva.entrega
        SET link_gdrive = :gdrive_link, link_icloud = :icloud_link, link_airdrop = :airdrop_link, link_microsoft = :microsoft_link
        `,
        {
            replacements: { id_entrega, gdrive_link, icloud_link, airdrop_link, microsoft_link },
            type: QueryTypes.UPDATE,
            transaction
        }
    );
}


const completeSession = async (id_reserva, transaction) => {
    await sequelize.query(
        `UPDATE reserva.reserva
        SET estado = 'C'
        WHERE id_reserva = cast(:id_reserva AS int)
        `,
        {
            replacements: { id_reserva },
            type: QueryTypes.UPDATE,
            transaction
        }
    );
}

const deleteImageDelivery = async (id_imagen, transaction) => {
    // Obtener rutas antes de eliminar para poder borrar archivos
    const [existing] = await sequelize.query(
        `SELECT url_imagen, url_thumbnail FROM reserva.imagenes_entrega
        WHERE id_imagen = cast(:id_imagen AS int)
        `,
        {
            replacements: { id_imagen },
            type: QueryTypes.SELECT,
        }
    );

    await sequelize.query(
        `DELETE FROM reserva.imagenes_entrega
        WHERE id_imagen = cast(:id_imagen AS int)
        `,
        {
            replacements: { id_imagen },
            type: QueryTypes.DELETE,
            transaction
        }
    );

    return existing || null;
}

const getInfoServices = async (userId) => {
    const result = await sequelize.query(
        `
        SELECT
            s.id_servicio,
            f.id AS id_fotografo,
            s.nombre,
            s.descripcion,
            s.precio_hora,
            s.editadas,
            s.no_editadas,
            tm.id_moneda,
            tm.codigo,
            tm.simbolo
        FROM fotografo.servicios s
        INNER JOIN fotografo.fotografos f
            ON f.id = s.id_fotografo
        INNER JOIN public.tipo_moneda tm
            ON tm.id_moneda = s.id_moneda
        WHERE f.id_usuario = cast(:id_usuario AS int)
        AND s.estado = 'A';
        `,
        {
            replacements: { id_usuario: userId },
            type: QueryTypes.SELECT
        }
    );
    return result;
};

const getInfoGallery = async (userId) => {
    const result = await sequelize.query(
        `
        SELECT
            t.id_servicio,
            t.id_imagen,
            t.thumbnail
        FROM fotografo.imagen_servicio t
        INNER JOIN fotografo.servicios s
            ON s.id_servicio = t.id_servicio
        INNER JOIN fotografo.fotografos f
            ON f.id = s.id_fotografo
        WHERE f.id_usuario = cast(:id_usuario AS int)
        `,
        {
            replacements: { id_usuario: userId },
            type: QueryTypes.SELECT
        }
    );
    return result;
}


const getLocations = async () => {
    const result = await sequelize.query(
        `SELECT id_ubicacion, ciudad, estado, pais, codigo_pais 
            FROM catalogo.ubicaciones 
            WHERE activo = true 
            ORDER BY pais, ciudad;`,
        {
            type: QueryTypes.SELECT
        }
    );
    return result;
};

/**
 * Obtiene el id_cliente de una reserva.
 * Se usa para determinar a quién notificar cuando cambia el estado.
 */
const getBookingOwner = async (id_reserva) => {
    const result = await sequelize.query(
        `SELECT id_cliente, id_fotografo, estado
         FROM reserva.reserva
         WHERE id_reserva = CAST(:id_reserva AS int)`,
        {
            replacements: { id_reserva },
            type: QueryTypes.SELECT
        }
    );
    return result[0] ?? null;
};



const addService = async (service, transaction) => {
    try {
        const result = await sequelize.query(
            `
            INSERT INTO fotografo.servicios (
                id_fotografo,
                nombre,
                descripcion,
                precio_hora,
                id_moneda,
                editadas,
                no_editadas
            )
            VALUES (
                :photographer_id,
                :name,
                :description,
                :price_hour,
                :currency_id,
                :edited_photos,
                :unedited_photos
            )
            RETURNING *;
            `,
            {
                replacements: {
                    photographer_id: service.id_fotografo,
                    name: service.nombre,
                    description: service.descripcion,
                    price_hour: service.precio_hora,
                    currency_id: service.id_moneda,
                    edited_photos: service.editadas,
                    unedited_photos: service.no_editadas,
                },
                type: QueryTypes.INSERT,
                transaction,
            }
        );

        return result[0][0];
    } catch (error) {
        console.error('Error registering services:', error);
        throw new Error('Error al registrar los servicios');
    }
};

const addServiceCategories = async (serviceId, categories, transaction) => {
    for (const idCategoria of categories) {
        await sequelize.query(
            `
      INSERT INTO catalogo.servicio_categoria (
          id_servicio,
          id_categoria
      )
      VALUES (
          :serviceId,
          :categoryId
      );
      `,
            {
                replacements: {
                    serviceId,
                    categoryId: idCategoria,
                },
                type: QueryTypes.INSERT,
                transaction,
            }
        );
    }
};


const addGalleryImages = async (imagesData, transaction) => {
    try {
        for (let i = 0; i < imagesData.length; i++) {
            const item = imagesData[i];
            await sequelize.query(
                `INSERT INTO fotografo.imagen_servicio (id_servicio, imagen, thumbnail)
        VALUES (:id_servicio, :imagen, :thumbnail)`,
                {
                    replacements: {
                        id_servicio: item.id_servicio,
                        imagen: item.imagen.buffer,
                        thumbnail: item.thumbnail
                    },
                    type: QueryTypes.INSERT,
                    transaction
                }
            );
        }
    } catch (error) {
        console.error('Error registering gallery images:', error);
        throw new Error('Error al registrar las imágenes de la galería');
    }
};


export default {
    start_transaction,
    getInfoPhotoDbById,
    getInfoSessionPhotoDbById,
    changeStatusSession,
    changeAvailability,
    createDelivery,
    uploadImagesDelivery,
    uploadLinksDelivery,
    completeSession,
    dropImagesDelivery,
    uploadImageDelivery,
    deleteImageDelivery,
    getInfoServices,
    getInfoGallery,
    addService,
    addServiceCategories,
    addGalleryImages,
    getLocations,
    getBookingOwner


};


