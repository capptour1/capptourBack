
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const getNearbyPhotographers = async (lat, lng, role, priceMin, delta) => {
    const bounds = {
        minLat: lat - delta,
        maxLat: lat + delta,
        minLng: lng - delta,
        maxLng: lng + delta,
    };

    const query = `
        SELECT *,
          power((location->>'latitude')::double precision - :lat, 2) +
            power((location->>'longitude')::double precision - :lng, 2)
            AS distance_rank
        FROM photographers
        WHERE (location->>'latitude')::double precision BETWEEN :minLat AND :maxLat
            AND (location->>'longitude')::double precision BETWEEN :minLng AND :maxLng
            AND role = :role
            AND price >= :priceMin
        ORDER BY distance_rank
        LIMIT 200
    `;
    const photographers = await sequelize.query
        (query,
            {
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
            }
        );
    return photographers;
};

export default {
    getNearbyPhotographers,
};