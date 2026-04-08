import explorerDao from '../dao/explorer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const getExplorerImages = async (req, res) => {
    try {
        const gallery = await explorerDao.getExplorerImages();
        return successResponse(res, gallery, 'Gallery fetched successfully');
    }
    catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

const getFullImage = async (req, res) => {
    try {
        const { id_imagen } = req.body;
        if (!id_imagen) {
            throw new AppError('id_imagen is required', 400);
        }
        const fullImage = await explorerDao.getFullImage(id_imagen);
        if (!fullImage) {
            throw new AppError('Image not found', 404);
        }
        return successResponse(res, fullImage, 'Full gallery image fetched successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

export default {
    getExplorerImages,
    getFullImage
};