
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


const getRoles = async (req, res) => {
    try {
        const roles = await SharedDao.getRoles();
        return successResponse(res, roles, 'Roles obtenidos correctamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
}


const getCurrencies = async (req, res) => {
    try {
        const currencies = await SharedDao.getCurrencies();
        return successResponse(res, currencies, 'Monedas obtenidas exitosamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};



const getCountries = async (req, res) => {
    try {
        console.log('Get countries controller called');
        const countries = await SharedDao.getCountries();
        console.log('Countries obtained:', countries);
        return successResponse(res, countries, 'Países obtenidos exitosamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};

const getGenders = async (req, res) => {
    try {
        console.log('Get genders controller called');
        const genders = await SharedDao.getGenders();
        return successResponse(res, genders, 'Géneros obtenidos exitosamente');
    }
    catch (error) {
        return errorResponse(res, error);
    }
};


export default {
    getCategories,
    getCurrencies,
    getCountries,
    getGenders,
    getRoles
};