import UserDAO from '../dao/user.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const get_user_by_id = async (req, res) => {
  try {
    console.log('Get user by ID controller called', req.body);
    const { userId } = req.body;
    const user = await UserDAO.get_user_by_id(userId);
    if (!user) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }
    return successResponse(res, user, 'Fotógrafo encontrado');
  } catch (error) {
    return errorResponse(res, error);
  }
};


const get_info_photo_by_id = async (req, res) => {
  try {
    console.log('Get info photographer by ID controller called', req.body);
    const { userId } = req.body;
    const userInfo = await UserDAO.get_info_photo_by_id(userId);
    if (!userInfo) {
      throw new AppError('Información del fotógrafo no encontrada', 404);
    }
    return successResponse(res, userInfo, 'Información del fotógrafo encontrada');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


const get_monedas = async (req, res) => {
  try {
    console.log('Get monedas controller called');
    const monedas = await UserDAO.get_monedas();
    return successResponse(res, monedas, 'Monedas obtenidas exitosamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


export default {
  get_user_by_id,
  get_info_photo_by_id,
  get_monedas
};