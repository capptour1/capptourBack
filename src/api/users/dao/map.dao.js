
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const getNearbyPhotographers = async (lat, lng, role, priceMin) => {

    let delta = 0.03; // ~3 km inicial
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
        const bounds = {
            minLat: lat - delta,
            maxLat: lat + delta,
            minLng: lng - delta,
            maxLng: lng + delta,
        };

        const query = `
        SELECT f.id, u.nombre_completo as name, fp.ubicacion as location, 5 as rating, 12 as jobs_count,
        fp.descripcion as description, fp.precio_hora_cop as price_cop, fp.precio_hora_usd as price_usd,
        fp.thumbnail,
          power((fp.ubicacion->>'latitude')::double precision - :lat, 2) +
          power((fp.ubicacion->>'longitude')::double precision - :lng, 2)
          AS distance_rank
        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        INNER JOIN fotografo.foto_portafolio fp ON f.id = fp.id_fotografo
        INNER JOIN fotografo.foto_experiencia fe ON f.id = fe.id_fotografo
        WHERE (fp.ubicacion->>'latitude')::double precision BETWEEN :minLat AND :maxLat
         AND (fp.ubicacion->>'longitude')::double precision BETWEEN :minLng AND :maxLng
         AND f.is_active = true
         --AND fp.precio_hora_cop >= :priceMin
         --AND fp.precio_hora_usd >= :priceMin
         --AND fe.id_tipo_exp = :role
        ORDER BY distance_rank;
      `;

        const result = await sequelize.query(query, {
            replacements: {
                lat,
                lng,
                minLat: bounds.minLat,
                maxLat: bounds.maxLat,
                minLng: bounds.minLng,
                maxLng: bounds.maxLng,
                role,
                priceMin
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

const getServicesPhotographer = async (photographerId) => {
    const query = `
        SELECT fs.id_servicio as id, fs.nombre as name, fs.descripcion as description, fs.precio_hora_cop as price_hour_cop, fs.precio_hora_usd as price_hour_usd,
        fs.precio_foto_cop as price_photo_cop, fs.precio_foto_usd as price_photo_usd
        FROM fotografo.foto_servicio fs
        WHERE fs.id_fotografo = :photographerId;
    `;
    const result = await sequelize.query
        (query, {
            replacements: {
                photographerId
            },
            type: QueryTypes.SELECT
        });
    return result;
}

const getGalleryPhotographer = async (photographerId) => {
    const query = `
        SELECT gp.id_foto as id,
         gp.thumbnail
        FROM fotografo.foto_galeria gp
        WHERE gp.id_fotografo = :photographerId;
    `;
    const result = await sequelize.query
        (query, {
            replacements: {
                photographerId
            },
            type: QueryTypes.SELECT
        });

    return result;
}



const getNearbyPhotographerById = async (PhotographerId) => {

    const query = `
        SELECT f.id, u.nombre_completo as name, fp.ubicacion as location, 5 as rating, 12 as jobs_count,
        fp.descripcion as description, fp.precio_hora_cop as price_cop, fp.precio_hora_usd as price_usd,
        fp.thumbnail
        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u ON f.usuario_id = u.id
        INNER JOIN fotografo.foto_portafolio fp ON f.id = fp.id_fotografo
        INNER JOIN fotografo.foto_experiencia fe ON f.id = fe.id_fotografo
        WHERE f.id = :PhotographerId
      `;

    const result = await sequelize.query(query, {
        replacements: {
            PhotographerId
        },
        type: QueryTypes.SELECT
    });

    if (result.length === 0) {
        throw new AppError('Fotógrafo no encontrado', 404);
    }

    return result[0];
};

// =============================================================================

/*
Todo: Pendiente rating y número de trabajos realizados, así como experiencia y rol del fotógrafo.
*/

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
            5 AS rating,
            12 AS solicitudes,
            l.latitud,
            l.longitud,

            POWER(l.latitud - :lat, 2) +
            POWER(l.longitud - :lng, 2) AS distancia,

            CASE 
                WHEN f.experiencia = 1 THEN 'Inicial'
                WHEN f.experiencia = 2 THEN 'Intermedio'
                WHEN f.experiencia = 3 THEN 'Experto'
                ELSE 'Desconocido'
            END AS experiencia,
            f.experiencia as id_experiencia,
            CASE 
                WHEN f.rol = 1 THEN 'Colaborador'
                WHEN f.rol = 2 THEN 'Profesional'
                ELSE 'Desconocido'
            END AS rol,
            f.rol as id_rol,
            fs.precio_hora_cop,
            fs.precio_hora_usd

        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u 
            ON f.usuario_id = u.id
        INNER JOIN fotografo.localizacion l 
            ON f.id = l.id_fotografo

        LEFT JOIN LATERAL (
            SELECT precio_hora_cop, precio_hora_usd
            FROM fotografo.servicios fs
            WHERE fs.id_fotografo = f.id
            AND fs.estado = 'A'
            ORDER BY fs.fec_creacion DESC
            LIMIT 1
        ) fs ON TRUE

        WHERE l.latitud BETWEEN :minLat AND :maxLat
        AND l.longitud BETWEEN :minLng AND :maxLng
        AND f.is_active = true
        AND u.rol_id = 5

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

export default {
    getNearbyPhotographers,
    getServicesPhotographer,
    getGalleryPhotographer,
    getNearbyPhotographerById,
    searchPhotographers
};