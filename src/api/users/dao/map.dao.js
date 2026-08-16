
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';


const searchPhotographers = async (lat, lng) => {

    let delta = 0.1; // ~3 km inicial
    let photographers = [];
    const MIN_RESULTS = 10;
    const MAX_RESULTS = 150;
    const MAX_ITERATIONS = 5;

    const bounds = {
        minLat: lat - delta,
        maxLat: lat + delta,
        minLng: lng - delta,
        maxLng: lng + delta,
    };


    for (let i = 0; i < MAX_ITERATIONS; i++) {

        const query = `
        SELECT 
            f.id,
            u.nombre_completo AS nombre,
            u.foto_perfil as thumbnail,
            5 AS rating,
            12 AS solicitudes,
            l.latitud,
            l.longitud,

            POWER(l.latitud - :lat, 2) +
            POWER(l.longitud - :lng, 2) AS distancia,
            te.descripcion AS experiencia,
            te.id_experiencia as id_experiencia,
            tr.descripcion AS rol,
            tr.id_rol as id_rol

        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u 
            ON f.id_usuario = u.id
        INNER JOIN fotografo.localizacion l 
            ON f.id = l.id_fotografo
        INNER JOIN fotografo.tipo_experiencia te
            ON f.id_experiencia = te.id_experiencia
        INNER JOIN fotografo.tipo_rol tr
            ON f.id_rol = tr.id_rol
        WHERE l.latitud BETWEEN :minLat AND :maxLat
        AND l.longitud BETWEEN :minLng AND :maxLng
        AND f.is_active = true
        AND u.tipo_usuario = 5

        ORDER BY distancia;
      `;

        const result = await sequelize.query(query, {
            replacements: {
                lat,
                lng,
                minLat: bounds.minLat,
                maxLat: bounds.maxLat,
                minLng: bounds.minLng,
                maxLng: bounds.maxLng,
            },
            type: QueryTypes.SELECT
        });
        photographers = result;

        if (photographers.length >= MIN_RESULTS &&
            photographers.length <= MAX_RESULTS) {
            break;
        }

        // Ajuste dinámico
        delta = photographers.length < MIN_RESULTS
            ? delta * 2
            : delta / 2;
    }

    return photographers;
};


const getServicesByPhotographerId = async (photographerId) => {
    const query = `
        SELECT
            s.id_servicio,
            s.id_fotografo,
            s.nombre_servicio,
            s.descripcion,
            s.precio,
            s.duracion,
            s.id_moneda,
            tm.codigo,
            tm.simbolo
        FROM fotografo.servicios s
        INNER JOIN public.tipo_moneda tm
            ON s.id_moneda = tm.id_moneda
        WHERE s.id_fotografo = :photographerId
        AND s.estado = 'A';
    `;

    const services = await sequelize.query(query, {
        replacements: { photographerId },
        type: QueryTypes.SELECT
    });

    return services;
}

const getServicesByPhotographerIds = async (photographerIds) => {

    if (!photographerIds.length) {
        return [];
    }

    const query = `
        SELECT
            s.id_fotografo,
            s.id_servicio,
            s.nombre,
            s.descripcion,
            s.precio_hora,
            s.editadas,
            s.no_editadas,
            s.id_moneda,
            tm.codigo,
            tm.simbolo,
            sc.id_categoria,
            cs.nombre AS nombre_categoria

        FROM fotografo.servicios s
        INNER JOIN fotografo.servicio_categoria sc
            ON sc.id_servicio = s.id_servicio
        INNER JOIN catalogo.categoria_servicio cs
            ON cs.id_categoria = sc.id_categoria
        INNER JOIN public.tipo_moneda tm
            ON s.id_moneda = tm.id_moneda
        WHERE s.estado = 'A'
        AND s.id_fotografo IN (:photographerIds);
    `;

    return await sequelize.query(query, {
        replacements: { photographerIds },
        type: QueryTypes.SELECT
    });
};


export default {
    searchPhotographers,
    getServicesByPhotographerId,
    getServicesByPhotographerIds
};