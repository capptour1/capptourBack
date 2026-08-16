import explorerDao from '../dao/explorer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import storageService from '../../../services/storage.service.js';

const { successResponse, errorResponse } = HelperResponse;

const getExplorerImages = async (req, res) => {
    try {
        const gallery = await explorerDao.getExplorerImages();

        // Resolver URLs de thumbnails
        const resolved = gallery.map(img => ({
            ...img,
            url_thumbnail: img.url_thumbnail ? storageService.getUrl(img.url_thumbnail) : null,
        }));

        return successResponse(res, resolved, 'Gallery fetched successfully');
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

        // Resolver URLs
        const resolved = {
            ...fullImage,
            url_imagen: fullImage.url_imagen ? storageService.getUrl(fullImage.url_imagen) : null,
            url_thumbnail: fullImage.url_thumbnail ? storageService.getUrl(fullImage.url_thumbnail) : null,
        };

        return successResponse(res, resolved, 'Full gallery image fetched successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

export default {
    getExplorerImages,
    getFullImage,
};
