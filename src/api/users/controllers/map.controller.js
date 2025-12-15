

import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const getNearbyPhotographers = async (req, res) => {
    try {
        const { latitude, longitude, radius, bounds } = req.body;

        console.log('Received parameters:', { latitude, longitude, radius, bounds });
    } catch (error) {
        return errorResponse(res, error);
    }
};

export default {
    getNearbyPhotographers,
};
