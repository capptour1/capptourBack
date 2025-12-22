import explorerDao from '../dao/explorer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const get_images = async (req, res) => {
    try {
        const images = await explorerDao.get_images();
        return successResponse(res, images);
    } catch (error) {
        console.error('Error en get_images controller:', error);
        return errorResponse(res, error);
    }
};

export default {
    get_images
};