

import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const getNearbyPhotographers = async (req, res) => {
    try {
        const { location, role, priceMin } = req.body;

        if (!location?.latitude || !location?.longitude) {
            return res.status(400).json({ message: 'Location requerida' });
        }

        const lat = location.latitude;
        const lng = location.longitude;

        let delta = 0.03; // ~3 km inicial
        let photographers = [];
        const MIN_RESULTS = 10;
        const MAX_RESULTS = 150;
        const MAX_ITERATIONS = 5;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const bounds = {
                minLat: lat - delta,
                maxLat: lat + delta,
                minLng: lng - delta,
                maxLng: lng + delta,
            };

            const query = `
        SELECT *,
          power((location->>'latitude')::double precision - $1, 2) +
          power((location->>'longitude')::double precision - $2, 2)
          AS distance_rank
        FROM photographers
        WHERE (location->>'latitude')::double precision BETWEEN $3 AND $4
          AND (location->>'longitude')::double precision BETWEEN $5 AND $6
          AND role = $7
          AND price >= $8
        ORDER BY distance_rank
        LIMIT 200
      `;

            const values = [
                lat,
                lng,
                bounds.minLat,
                bounds.maxLat,
                bounds.minLng,
                bounds.maxLng,
                role,
                priceMin,
            ];

            const result = await pool.query(query, values);
            photographers = result.rows;

            if (photographers.length >= MIN_RESULTS &&
                photographers.length <= MAX_RESULTS) {
                break;
            }

            // Ajuste dinámico
            delta = photographers.length < MIN_RESULTS
                ? delta * 2
                : delta / 2;
        }

        return res.json({
            count: photographers.length,
            photographers,
        });

    } catch (error) {
        console.error('getNearbyPhotographers error:', error);
        return errorResponse(res, error);
    }
};

export default {
    getNearbyPhotographers,
};
