
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
            tr.id_rol as id_rol,
            fs.precio_hora,
            fs.id_moneda,
            fs.codigo as moneda_codigo

        FROM fotografo.fotografos f
        INNER JOIN auth.usuarios u 
            ON f.usuario_id = u.id
        INNER JOIN fotografo.localizacion l 
            ON f.id = l.id_fotografo
        INNER JOIN fotografo.tipo_experiencia te
            ON f.id_experiencia = te.id_experiencia
        INNER JOIN fotografo.tipo_rol tr
            ON f.id_rol = tr.id_rol
        LEFT JOIN LATERAL (
            SELECT precio_hora, tm.id_moneda, tm.codigo
            FROM fotografo.servicios fs
            INNER JOIN fotografo.tipo_moneda tm ON fs.id_moneda = tm.id_moneda
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
    searchPhotographers
};