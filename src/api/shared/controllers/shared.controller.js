
import SharedDao from '../dao/shared.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const getCategories = async (req, res) => {
    try {
        const categories = await SharedDao.getCategories();
        return successResponse(res, categories, 'Categorías obtenidas correctamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};



const getCurrencies = async (req, res) => {
    try {
        const currencies = await SharedDao.getCurrencies();
        return successResponse(res, currencies, 'Monedas obtenidas exitosamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};



export default {
    getCategories,
    getCurrencies
};