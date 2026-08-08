
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';



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
        `SELECT
            f.id AS id_fotografo,
            u.nombre_completo AS nombre,
            u.foto_perfil AS thumbnail,
            u.rol_id AS id_rol,
            u.fecha_nacimiento,

            f.descripcion AS biografia,
            f.herramientas,

            5 AS rating,
            120 AS reservas,
            TRUE AS favorito,

            CONCAT(p.codigo_telefono, ' ', ut.telefono) AS celular,

            l.latitud,
            l.longitud,

            te.descripcion AS experiencia,
            tr.descripcion AS rol

        FROM fotografo.fotografos f

        INNER JOIN auth.usuarios u
            ON u.id = f.id_usuario

        LEFT JOIN fotografo.localizacion l
            ON l.id_fotografo = f.id

        INNER JOIN fotografo.tipo_experiencia te
            ON te.id_experiencia = f.id_experiencia

        INNER JOIN fotografo.tipo_rol tr
            ON tr.id_rol = f.id_rol

        LEFT JOIN auth.usuario_telefono ut
            ON ut.id_usuario = u.id

        LEFT JOIN public.paises p
            ON p.id_pais = ut.id_pais

        WHERE f.id = :id_fotografo
        AND f.is_active = true;`,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    return result[0];
};

const getInfoServicesByPhotographerId = async (photographerId) => {
    const result = await sequelize.query(
        `
        SELECT
            s.id_servicio,
            s.nombre,
            s.descripcion,
            s.precio_hora,
            s.editadas,
            s.no_editadas,
            tm.id_moneda,
            tm.codigo,
            tm.simbolo,
            s.id_fotografo

        FROM fotografo.servicios s

        INNER JOIN fotografo.tipo_moneda tm
            ON tm.id_moneda = s.id_moneda

        WHERE s.id_fotografo = :id_fotografo
        AND s.estado = 'A'

        ORDER BY s.fec_creacion DESC;
        `,
        {
            replacements: { id_fotografo: photographerId },
            type: QueryTypes.SELECT
        }
    );
    return result;
};

const getInfoGalleryByPhotographerId = async (photographerId) => {
    const result = await sequelize.query(
        `
        SELECT
            t.id_imagen,
            t.id_servicio,
            t.thumbnail

        FROM fotografo.imagen_servicio t

        INNER JOIN fotografo.servicios s
            ON s.id_servicio = t.id_servicio

        WHERE s.id_fotografo = :id_fotografo

        ORDER BY t.id_imagen;
        `,
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
            INNER JOIN auth.usuarios u ON f.id_usuario = u.id
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
        LEFT JOIN fotografo.fotografos f ON u.id = f.id_usuario
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
        `UPDATE fotografo.fotografos SET descripcion = :descripcion, herramientas = :herramientas WHERE id_usuario = cast(:id_usuario AS int) RETURNING id;`,
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

    const {
        id_cliente,
        id_fotografo,
        latitud,
        longitud
    } = data;

    const idCobertura = await obtenerCoberturaFotografo(
        id_fotografo,
        transaction
    );

    const servicio = await obtenerServicioGlobal(
        id_fotografo,
        transaction
    );

    const tarifa = await obtenerTarifaServicio(
        servicio.id_servicio_global,
        idCobertura,
        transaction
    );

    const reserva = await crearReserva(
        {
            id_cliente,
            id_fotografo,
            latitud,
            longitud
        },
        transaction
    );

    await crearReservaServicio(
        reserva.id_reserva,
        servicio,
        tarifa,
        transaction
    );

    return reserva;
};

const obtenerCoberturaFotografo = async (
    idFotografo,
    transaction
) => {

    const cobertura = await sequelize.query(
        `
        SELECT id_cobertura
        FROM catalogo.cobertura
        WHERE codigo_iso='CO'
        LIMIT 1;
        `,
        {
            type: QueryTypes.SELECT,
            transaction
        }
    );

    if (!cobertura.length) {
        throw new AppError(
            'No existe cobertura configurada.',
            400
        );
    }

    return cobertura[0].id_cobertura;
};

const obtenerServicioGlobal = async (
    idFotografo,
    transaction
) => {

    const servicio = await sequelize.query(
        `
        SELECT
            id_servicio_global,
            nombre,
            descripcion
        FROM catalogo.servicio_global
        WHERE estado='A'
        ORDER BY id_servicio_global
        LIMIT 1;
        `,
        {
            type: QueryTypes.SELECT,
            transaction
        }
    );

    if (!servicio.length) {
        throw new AppError(
            'No existe un servicio global disponible.',
            400
        );
    }

    return servicio[0];
};

const obtenerTarifaServicio = async (
    idServicioGlobal,
    idCobertura,
    transaction
) => {

    const tarifa = await sequelize.query(
        `
        SELECT
            t.id_tarifa,
            t.precio_base,
            t.precio_minimo,
            t.id_moneda
        FROM catalogo.servicio_global_tarifa t
        WHERE
            t.id_servicio_global = :idServicioGlobal
            AND t.id_cobertura = :idCobertura
            AND t.estado='A'
        LIMIT 1;
        `,
        {
            replacements: {
                idServicioGlobal,
                idCobertura
            },
            type: QueryTypes.SELECT,
            transaction
        }
    );

    if (!tarifa.length) {
        throw new AppError(
            'No existe una tarifa para la cobertura.',
            400
        );
    }

    return tarifa[0];
};

const crearReserva = async (
    data,
    transaction
) => {

    const {
        id_cliente,
        id_fotografo,
        latitud,
        longitud
    } = data;

    const now = new Date();

    const fecha = now.toISOString().substring(0, 10);

    const result = await sequelize.query(
        `
        INSERT INTO reserva.reserva
        (
            id_cliente,
            id_fotografo,
            fecha,
            hora_inicio,
            hora_fin,
            longitud,
            latitud,
            estado,
            notas
        )
        VALUES
        (
            :id_cliente,
            :id_fotografo,
            :fecha,
            NULL,
            NULL,
            :longitud,
            :latitud,
            'A',
            'Sesión inmediata vía QR'
        )
        RETURNING id_reserva;
        `,
        {
            replacements: {
                id_cliente,
                id_fotografo,
                fecha,
                longitud: longitud || null,
                latitud: latitud || null
            },
            type: QueryTypes.INSERT,
            transaction
        }
    );

    return result[0][0];
};

const crearReservaServicio = async (
    idReserva,
    servicio,
    tarifa,
    transaction
) => {

    await sequelize.query(
        `
        INSERT INTO reserva.reserva_servicio
        (
            id_reserva,
            id_origen,
            id_tarifa,
            origen,
            nombre,
            descripcion,
            cantidad,
            editadas,
            no_editadas,
            precio_base,
            precio_minimo,
            precio_final,
            id_moneda
        )
        VALUES
        (
            :idReserva,
            :idServicioGlobal,
            :idTarifa,
            'G',
            :nombre,
            :descripcion,
            1,
            0,
            0,
            :precioBase,
            :precioMinimo,
            :precioBase,
            :idMoneda
        );
        `,
        {
            replacements: {
                idReserva,
                idServicioGlobal: servicio.id_servicio_global,
                idTarifa: tarifa.id_tarifa,
                nombre: servicio.nombre,
                descripcion: servicio.descripcion,
                precioBase: tarifa.precio_base,
                precioMinimo: tarifa.precio_minimo,
                idMoneda: tarifa.id_moneda
            },
            transaction
        }
    );
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