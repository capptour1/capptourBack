

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

        const photographers = await mapDao.searchPhotographers(
            latitude,
            longitude
        );

        if (!photographers.length) {
            return successResponse(res, []);
        }

        const photographerIds = photographers.map(p => p.id);

        const services = await mapDao.getServicesByPhotographerIds(
            photographerIds
        );

        const servicesMap = {};

        for (const service of services) {

            if (!servicesMap[service.id_fotografo]) {
                servicesMap[service.id_fotografo] = [];
            }

            servicesMap[service.id_fotografo].push(service);
        }

        for (const photographer of photographers) {
            photographer.services = servicesMap[photographer.id] || [];
        }

        return successResponse(
            res,
            photographers
        );

    } catch (error) {
        console.error('getNearbyPhotographers error:', error);
        return errorResponse(res, error);
    }
};

export default {
    searchPhotographers
};
