
import PhotographerDAO from '../dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const get_photographer_by_id = async (req, res) => {
  try {
    console.log('Get photographer by ID controller called', req.body);
    const { userId } = req.body;
    const photographer = await PhotographerDAO.get_photographer_by_id(userId);
    if (!photographer) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }
    return successResponse(res, photographer, 'Fotógrafo encontrado');
  } catch (error) {
    return errorResponse(res, error);
  }
};

export default {
    getPhotographerById: get_photographer_by_id
};
