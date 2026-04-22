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
            f.is_active as disponibilidad
            FROM fotografo.fotografos f 
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            LEFT JOIN fotografo.localizacion l ON f.id = l.id_fotografo 
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
            f.id as id_fotografo, 
            c.id as id_cliente, c.nombre_completo as nombre_cliente,
            c.foto_perfil as thumbnail_cliente, 
            s.id_servicio, s.nombre as nombre_servicio, s.descripcion as descripcion_servicio,
            s.precio_hora, s.editadas, s.no_editadas,
            tm.codigo
        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        INNER JOIN fotografo.servicios s ON f.id = s.id_fotografo
        INNER JOIN reserva.reserva r ON r.id_servicio = s.id_servicio
        INNER JOIN auth.usuarios c ON r.id_cliente = c.id
        INNER JOIN fotografo.tipo_moneda tm ON s.id_moneda = tm.id_moneda
        WHERE f.usuario_id = cast(:id_usuario AS int);
        `
        ,
        {
            replacements: { id_usuario: id_usuario },
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
        WHERE usuario_id = cast(:id_usuario AS int)
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
        `INSERT INTO reserva.imagenes_entrega (id_entrega, imagen, thumbnail)
        VALUES (cast(:id_entrega AS int), :imagen, :thumbnail)
            RETURNING id_imagen, thumbnail
        `,
        {
            replacements: {
                id_entrega: dataPicture.id_entrega,
                imagen: dataPicture.imagen,
                thumbnail: dataPicture.thumbnail
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
}

const getInfoServices = async (photographerId) => {
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

const getInfoGallery = async (photographerId) => {
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


const addService = async (service, transaction) => {
    try {
        const result = await sequelize.query(
            `INSERT INTO fotografo.servicios (id_fotografo, nombre, descripcion, precio_hora,
        id_moneda, editadas, no_editadas)
        VALUES (:photographer_id, :name, :description, :price_hour,
        :currency_id, :edited_photos, :unedited_photos)
        RETURNING *;`,
            {
                replacements: {
                    photographer_id: service.id_fotografo,
                    name: service.nombre,
                    description: service.descripcion,
                    price_hour: service.precio_hora,
                    currency_id: service.id_moneda,
                    edited_photos: service.editadas,
                    unedited_photos: service.no_editadas
                },
                type: QueryTypes.INSERT,
                transaction
            }
        );
        return result[0][0];
    } catch (error) {
        console.error('Error registering services:', error);
        throw new Error('Error al registrar los servicios');
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
    addGalleryImages


};


