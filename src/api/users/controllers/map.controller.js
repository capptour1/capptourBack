

import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import mapDao from '../dao/map.dao.js';

const { successResponse, errorResponse } = HelperResponse;

const getNearbyPhotographers = async (req, res) => {
    try {
        const { location, role, priceMin } = req.body;

        if (!location?.latitude || !location?.longitude) {
            return res.status(400).json({ message: 'Location requerida' });
        }

        const lat = location.latitude;
        const lng = location.longitude;

        const photographers = await mapDao.getNearbyPhotographers(
            lat,
            lng,
            role,
            priceMin
        );

        console.log('Photographers found:', photographers);
        return successResponse(
            res,
            photographers
        );

        

    } catch (error) {
        console.error('getNearbyPhotographers error:', error);
        return errorResponse(res, error);
    }
};



const get_gallery_photographer = async (req, res) => {
    try {
        const { photographerId } = req.body;
        if (!photographerId) {
            throw new AppError('photographerId es requerido', 400);
        }
        const gallery = await mapDao.getGalleryPhotographer(photographerId);

        return successResponse(res, { services, gallery });
    } catch (error) {
        return errorResponse(res, error);
    }
};

const get_services_photographer = async (req, res) => {
    try {
        const { photographerId } = req.body;
        if (!photographerId) {
            throw new AppError('photographerId es requerido', 400);
        }
        const services = await mapDao.getServicesPhotographer(photographerId);

        return successResponse(res, { services });
    }
    catch (error) {
        return errorResponse(res, error);
    }
};


export default {
    getNearbyPhotographers,
    get_services_photographer,
    get_gallery_photographer
};
