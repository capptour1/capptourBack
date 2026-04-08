

import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import mapDao from '../dao/map.dao.js';

const { successResponse, errorResponse } = HelperResponse;


// NUEVO CONTROLADOR PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL

const searchPhotographers = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;


        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Location requerida' });
        }

        const lat = latitude;
        const lng = longitude;

        const photographers = await mapDao.searchPhotographers(
            lat,
            lng,
        );


        
        return successResponse(
            res,
            photographers
        );

        

    } catch (error) {
        console.error('getNearbyPhotographers error:', error);
        return errorResponse(res, error);
    }
}


export default {
    searchPhotographers
};
